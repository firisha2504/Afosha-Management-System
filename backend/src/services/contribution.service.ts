import { ObligationStatus, TransactionType } from '@prisma/client';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import {
  generateTransactionId,
  getNumericSetting,
  getWeekNumber,
  getNextSaturday,
} from './helpers.js';
import { sendPaymentReminderSms } from './notification.service.js';

type PenaltyCalculation = {
  penaltyAmount: number;
  isMonthlyPenalty: boolean;
  totalDue: number;
  consecutiveMissed: number;
};

async function getContributionSettings() {
  const contributionAmount = await getNumericSetting(
    'weekly_contribution',
    config.defaults.weeklyContribution
  );
  const weeklyPenalty = await getNumericSetting('weekly_penalty', config.defaults.weeklyPenalty);
  const monthlyPenalty = await getNumericSetting('monthly_penalty', config.defaults.monthlyPenalty);
  return { contributionAmount, weeklyPenalty, monthlyPenalty };
}

async function calculatePenaltyForMember(
  memberId: string,
  contributionAmount: number,
  weeklyPenalty: number,
  monthlyPenalty: number
): Promise<PenaltyCalculation> {
  const previousObligations = await prisma.weeklyObligation.findMany({
    where: {
      memberId,
      status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
    },
    orderBy: { dueDate: 'desc' },
    take: 4,
  });

  const consecutiveMissed = previousObligations.length;
  let penaltyAmount = 0;
  let isMonthlyPenalty = false;
  let totalDue = contributionAmount;

  if (consecutiveMissed >= 3) {
    const unpaidContributions = previousObligations.reduce(
      (sum, o) => sum + Number(o.contributionAmount) - Number(o.amountPaid),
      contributionAmount
    );
    penaltyAmount = monthlyPenalty;
    isMonthlyPenalty = true;
    totalDue = unpaidContributions + monthlyPenalty;
  } else if (consecutiveMissed >= 1) {
    penaltyAmount = weeklyPenalty;
    totalDue = contributionAmount + weeklyPenalty;
  }

  return { penaltyAmount, isMonthlyPenalty, totalDue, consecutiveMissed };
}

async function createMemberWeeklyObligation(
  memberId: string,
  weekNumber: number,
  year: number,
  dueDate: Date,
  applyPenalties: boolean
): Promise<boolean> {
  const existing = await prisma.weeklyObligation.findUnique({
    where: { memberId_weekNumber_year: { memberId, weekNumber, year } },
  });
  if (existing) return false;

  const { contributionAmount, weeklyPenalty, monthlyPenalty } = await getContributionSettings();
  const penalty = applyPenalties
    ? await calculatePenaltyForMember(memberId, contributionAmount, weeklyPenalty, monthlyPenalty)
    : {
        penaltyAmount: 0,
        isMonthlyPenalty: false,
        totalDue: contributionAmount,
        consecutiveMissed: 0,
      };

  await prisma.weeklyObligation.create({
    data: {
      memberId,
      weekNumber,
      year,
      dueDate,
      contributionAmount,
      penaltyAmount: penalty.penaltyAmount,
      totalDue: penalty.totalDue,
      status: ObligationStatus.PENDING,
      isMonthlyPenalty: penalty.isMonthlyPenalty,
      consecutiveMissedWeeks: penalty.consecutiveMissed,
    },
  });

  if (applyPenalties && penalty.consecutiveMissed >= 1 && penalty.penaltyAmount > 0) {
    await prisma.penalty.create({
      data: {
        memberId,
        amount: penalty.penaltyAmount,
        reason: penalty.isMonthlyPenalty
          ? 'Monthly penalty for 4 consecutive missed weeks'
          : 'Penalty for missed weekly contribution',
        weekNumber,
        year,
        isMonthly: penalty.isMonthlyPenalty,
      },
    });

    await prisma.member.update({
      where: { id: memberId },
      data: {
        outstandingBalance: { increment: penalty.totalDue },
      },
    });
  }

  return true;
}

export async function createWeeklyObligations(): Promise<number> {
  const dueDate = getNextSaturday();
  const weekNumber = getWeekNumber(dueDate);
  const year = dueDate.getFullYear();

  const members = await prisma.member.findMany({
    where: { status: 'APPROVED' },
    include: { user: { select: { phone: true, preferredLanguage: true } } },
  });

  let created = 0;
  for (const member of members) {
    const wasCreated = await createMemberWeeklyObligation(
      member.id,
      weekNumber,
      year,
      dueDate,
      true
    );
    if (wasCreated) created++;
  }

  return created;
}

/**
 * Generate weekly obligations for multiple upcoming weeks
 * @param numberOfWeeks - Number of weeks to generate (1-8)
 * @returns Summary of created obligations per week
 */
export async function createWeeklyObligationsForMultipleWeeks(numberOfWeeks: number): Promise<{
  totalCreated: number;
  weeksSummary: Array<{ weekNumber: number; year: number; created: number; dueDate: string }>;
}> {
  const members = await prisma.member.findMany({
    where: { status: 'APPROVED' },
    select: { id: true },
  });

  let totalCreated = 0;
  const weeksSummary: Array<{ weekNumber: number; year: number; created: number; dueDate: string }> = [];

  for (let weekOffset = 0; weekOffset < numberOfWeeks; weekOffset++) {
    const dueDate = getNextSaturday();
    dueDate.setDate(dueDate.getDate() + (weekOffset * 7));

    const weekNumber = getWeekNumber(dueDate);
    const year = dueDate.getFullYear();
    let createdThisWeek = 0;

    // Only the first generated week checks prior unpaid obligations for penalties.
    const applyPenalties = weekOffset === 0;

    for (const member of members) {
      const wasCreated = await createMemberWeeklyObligation(
        member.id,
        weekNumber,
        year,
        dueDate,
        applyPenalties
      );
      if (wasCreated) {
        createdThisWeek++;
        totalCreated++;
      }
    }

    weeksSummary.push({
      weekNumber,
      year,
      created: createdThisWeek,
      dueDate: dueDate.toISOString(),
    });
  }

  return { totalCreated, weeksSummary };
}

/**
 * Backfill penalties on obligations that were created without them (e.g. before penalty fix).
 */
export async function applyMissingPenaltiesToExistingObligations(): Promise<number> {
  const { contributionAmount, weeklyPenalty, monthlyPenalty } = await getContributionSettings();

  const obligations = await prisma.weeklyObligation.findMany({
    where: {
      penaltyAmount: 0,
      consecutiveMissedWeeks: 0,
      status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
    },
    orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
  });

  let fixed = 0;

  for (const obligation of obligations) {
    const priorUnpaid = await prisma.weeklyObligation.findMany({
      where: {
        memberId: obligation.memberId,
        status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
        OR: [
          { year: { lt: obligation.year } },
          { year: obligation.year, weekNumber: { lt: obligation.weekNumber } },
        ],
      },
      orderBy: { dueDate: 'desc' },
      take: 4,
    });

    if (priorUnpaid.length === 0) continue;

    const consecutiveMissed = priorUnpaid.length;
    let penaltyAmount = 0;
    let isMonthlyPenalty = false;
    let totalDue = Number(obligation.contributionAmount);

    if (consecutiveMissed >= 3) {
      const unpaidContributions = priorUnpaid.reduce(
        (sum, o) => sum + Number(o.contributionAmount) - Number(o.amountPaid),
        Number(obligation.contributionAmount)
      );
      penaltyAmount = monthlyPenalty;
      isMonthlyPenalty = true;
      totalDue = unpaidContributions + monthlyPenalty;
    } else {
      penaltyAmount = weeklyPenalty;
      totalDue = Number(obligation.contributionAmount) + weeklyPenalty;
    }

    const existingPenalty = await prisma.penalty.findFirst({
      where: {
        memberId: obligation.memberId,
        weekNumber: obligation.weekNumber,
        year: obligation.year,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.weeklyObligation.update({
        where: { id: obligation.id },
        data: {
          penaltyAmount,
          totalDue,
          isMonthlyPenalty,
          consecutiveMissedWeeks: consecutiveMissed,
        },
      });

      if (!existingPenalty && penaltyAmount > 0) {
        await tx.penalty.create({
          data: {
            memberId: obligation.memberId,
            amount: penaltyAmount,
            reason: isMonthlyPenalty
              ? 'Monthly penalty for 4 consecutive missed weeks'
              : 'Penalty for missed weekly contribution',
            weekNumber: obligation.weekNumber,
            year: obligation.year,
            isMonthly: isMonthlyPenalty,
          },
        });
      }

      const balanceIncrease = totalDue - Number(obligation.totalDue);
      if (balanceIncrease > 0) {
        await tx.member.update({
          where: { id: obligation.memberId },
          data: { outstandingBalance: { increment: balanceIncrease } },
        });
      }
    });

    fixed++;
  }

  return fixed;
}

export async function markOverdueObligations(): Promise<number> {
  const now = new Date();
  const result = await prisma.weeklyObligation.updateMany({
    where: {
      dueDate: { lt: now },
      status: ObligationStatus.PENDING,
    },
    data: { status: ObligationStatus.OVERDUE },
  });
  return result.count;
}

export async function sendUnpaidReminders(): Promise<number> {
  const overdue = await prisma.weeklyObligation.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
    include: {
      member: {
        include: { user: { select: { phone: true, preferredLanguage: true } } },
      },
    },
  });

  let sent = 0;
  for (const obligation of overdue) {
    const phone = obligation.member.user.phone;
    if (!phone) continue;

    const remaining = Number(obligation.totalDue) - Number(obligation.amountPaid);
    const lang = (obligation.member.user.preferredLanguage as 'en' | 'om') || 'om';
    await sendPaymentReminderSms(phone, remaining, lang);
    sent++;
  }

  return sent;
}

export async function recordLedgerEntry(
  memberId: string | null,
  type: TransactionType,
  amount: number,
  description: string,
  recordedById: string
): Promise<void> {
  await prisma.transaction.create({
    data: {
      transactionId: generateTransactionId(),
      memberId,
      type,
      amount,
      description,
      recordedById,
    },
  });
}

export async function applyPaymentToObligation(
  obligationId: string,
  amount: number
): Promise<void> {
  const obligation = await prisma.weeklyObligation.findUnique({
    where: { id: obligationId },
  });

  if (!obligation) return;

  const newPaid = Number(obligation.amountPaid) + amount;
  const totalDue = Number(obligation.totalDue);
  const balanceDecrement = Math.min(amount, totalDue - Number(obligation.amountPaid));

  let status: ObligationStatus = ObligationStatus.PARTIAL;
  if (newPaid >= totalDue) status = ObligationStatus.PAID;
  else if (newPaid === 0) status = ObligationStatus.PENDING;

  await prisma.$transaction(async (tx) => {
    await tx.weeklyObligation.update({
      where: { id: obligationId },
      data: { amountPaid: newPaid, status },
    });

    // Clamp to 0 so the balance never goes negative
    const current = await tx.member.findUnique({
      where: { id: obligation.memberId },
      select: { outstandingBalance: true },
    });
    const safeBalance = Math.max(0, Number(current?.outstandingBalance ?? 0) - balanceDecrement);
    await tx.member.update({
      where: { id: obligation.memberId },
      data: { outstandingBalance: safeBalance },
    });

    // Note: Penalties are NOT auto-settled when obligation is paid
    // Penalties must be paid separately through the Penalties page
  });
}

/**
 * Reverses a previously applied payment from an obligation.
 * Used when a verified payment is rolled back / corrected.
 */
export async function reversePaymentFromObligation(
  obligationId: string,
  amount: number
): Promise<void> {
  const obligation = await prisma.weeklyObligation.findUnique({
    where: { id: obligationId },
  });

  if (!obligation) return;

  const currentPaid = Number(obligation.amountPaid);
  const newPaid = Math.max(0, currentPaid - amount);
  const totalDue = Number(obligation.totalDue);

  // How much outstanding balance to restore
  const balanceIncrement = Math.min(amount, currentPaid);

  let status: ObligationStatus;
  if (newPaid <= 0) status = ObligationStatus.PENDING;
  else if (newPaid >= totalDue) status = ObligationStatus.PAID;
  else status = ObligationStatus.PARTIAL;

  await prisma.$transaction(async (tx) => {
    await tx.weeklyObligation.update({
      where: { id: obligationId },
      data: { amountPaid: newPaid, status },
    });

    // Restore the outstanding balance
    await tx.member.update({
      where: { id: obligation.memberId },
      data: { outstandingBalance: { increment: balanceIncrement } },
    });

    // Note: Penalties are NOT auto-reverted when obligation is rolled back
    // Penalties must be managed separately through the Penalties page
  });
}
