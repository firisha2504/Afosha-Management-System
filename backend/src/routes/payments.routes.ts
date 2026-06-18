import { Router, Response } from 'express';
import { PaymentMethod, PaymentStatus, TransactionType } from '@prisma/client';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createAuditEntry } from '../middleware/audit.js';
import {
  generatePaymentId,
  generateReceiptNumber,
} from '../services/helpers.js';
import {
  applyPaymentToObligation,
  reversePaymentFromObligation,
  recordLedgerEntry,
} from '../services/contribution.service.js';
import { applySpecialContributionPayment } from '../services/special-contribution.service.js';
import { recordPaymentSchema, paginationSchema } from '../validators/schemas.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { sendPushNotification } from '../services/notification.service.js';

const router = Router();

router.post('/', authenticate, authorize('ADMIN', 'AUDITOR'), validateBody(recordPaymentSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { memberId, amount, paymentMethod, transactionReference, specialContributionObligationId, notes } = req.body;
  let { obligationId } = req.body;
  const recordedById = req.user!.userId;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    sendError(res, 'member.notFound', lang, 404);
    return;
  }

  // Auto-link to the oldest unpaid/overdue weekly obligation if no obligationId provided
  if (!obligationId && !specialContributionObligationId) {
    const unpaidObligation = await prisma.weeklyObligation.findFirst({
      where: {
        memberId,
        status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
      },
      orderBy: { dueDate: 'asc' }, // oldest first
    });
    if (unpaidObligation) {
      obligationId = unpaidObligation.id;
    }
  }

  const transactionType = specialContributionObligationId
    ? TransactionType.SPECIAL_CONTRIBUTION
    : TransactionType.WEEKLY_CONTRIBUTION;

  const payment = await prisma.payment.create({
    data: {
      paymentId: generatePaymentId(),
      memberId,
      obligationId: obligationId || undefined,
      specialContributionObligationId,
      amount,
      paymentMethod,
      transactionReference,
      notes,
      recordedById,
      receiptNumber: generateReceiptNumber(),
      status: PaymentStatus.PENDING,
    },
    include: {
      member: { select: { fullName: true, memberId: true } },
      recordedBy: { select: { username: true } },
    },
  });

  await recordLedgerEntry(
    memberId,
    transactionType,
    amount,
    `Payment ${payment.paymentId}`,
    recordedById
  );

  if (obligationId) {
    await applyPaymentToObligation(obligationId, amount);
  }

  if (specialContributionObligationId) {
    await applySpecialContributionPayment(specialContributionObligationId, amount);
  }

  await createAuditEntry(recordedById, 'PAYMENT_RECORDED', 'payments', { paymentId: payment.paymentId }, req.ip);

  sendSuccess(res, payment, 'payment.recorded', lang, 201);
});

router.patch('/:id/verify', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const payment = await prisma.payment.update({
    where: { id: String(req.params.id) },
    data: {
      status: PaymentStatus.VERIFIED,
      verifiedById: req.user!.userId,
      verifiedAt: new Date(),
    },
    include: {
      member: { select: { fullName: true, memberId: true, userId: true } },
      verifiedBy: { select: { username: true } },
    },
  });

  // Obligation is already updated when the payment was recorded — do not apply again on verify.

  await prisma.notification.create({
    data: {
      userId: payment.member.userId,
      memberId: payment.memberId,
      type: 'PAYMENT_CONFIRMATION',
      title: 'Payment Confirmed',
      titleOm: 'Kaffaltiin Mirkanaa\'e',
      message: `Your payment of ${payment.amount} Birr has been verified.`,
      messageOm: `Kaffaltiin keessan Birr ${payment.amount} mirkanaa\'eera.`,
      metadata: { paymentId: payment.paymentId, receiptNumber: payment.receiptNumber },
    },
  });

  await sendPushNotification(
    payment.member.userId,
    lang === 'om' ? 'Kaffaltiin Mirkanaa\'e' : 'Payment Confirmed',
    lang === 'om'
      ? `Kaffaltiin keessan Birr ${payment.amount} mirkanaa\'eera.`
      : `Your payment of ${payment.amount} Birr has been verified.`
  );

  await createAuditEntry(req.user!.userId, 'PAYMENT_VERIFIED', 'payments', { paymentId: payment.paymentId }, req.ip);

  sendSuccess(res, payment, 'payment.verified', lang);
});

// Edit a payment — ADMIN only
// If PENDING: just update fields
// If VERIFIED: rollback old amount from obligation, apply new amount, add correction ledger entry
router.patch('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { amount, paymentMethod, transactionReference, notes, paymentDate, reason } = req.body;

  const existing = await prisma.payment.findUnique({
    where: { id: String(req.params.id) },
    include: { member: { select: { fullName: true, memberId: true } } },
  });
  if (!existing) { sendError(res, 'payment.notFound', lang, 404); return; }

  const oldAmount = Number(existing.amount);
  const newAmount = amount !== undefined ? Number(amount) : oldAmount;

  // If verified and amount is changing, reverse old and apply new to obligation
  if (existing.status === PaymentStatus.VERIFIED && existing.obligationId && newAmount !== oldAmount) {
    // Reverse old amount
    await reversePaymentFromObligation(existing.obligationId, oldAmount);
    // Apply new amount
    await applyPaymentToObligation(existing.obligationId, newAmount);

    // Add a correction ledger entry
    await recordLedgerEntry(
      existing.memberId,
      TransactionType.ADJUSTMENT,
      newAmount - oldAmount,
      `Payment correction for ${existing.paymentId}: ${reason || 'Admin correction'}`,
      req.user!.userId
    );
  }

  const payment = await prisma.payment.update({
    where: { id: String(req.params.id) },
    data: {
      ...(amount !== undefined && { amount: newAmount }),
      ...(paymentMethod && { paymentMethod }),
      ...(transactionReference !== undefined && { transactionReference }),
      ...(notes !== undefined && { notes }),
      ...(paymentDate && { paymentDate: new Date(paymentDate) }),
    },
    include: { member: { select: { fullName: true, memberId: true } } },
  });

  await createAuditEntry(
    req.user!.userId,
    existing.status === PaymentStatus.VERIFIED ? 'VERIFIED_PAYMENT_EDITED' : 'PAYMENT_UPDATED',
    'payments',
    { paymentId: payment.paymentId, oldAmount, newAmount, reason: reason || 'Admin correction' },
    req.ip
  );
  sendSuccess(res, payment, 'general.success', lang);
});

// Rollback (unverify) a verified payment — ADMIN only
// Reverses all effects: obligation status, balance, penalties, then sets back to PENDING
router.patch('/:id/rollback', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { reason } = req.body;

  const existing = await prisma.payment.findUnique({
    where: { id: String(req.params.id) },
    include: { member: { select: { fullName: true, memberId: true, userId: true } } },
  });
  if (!existing) { sendError(res, 'payment.notFound', lang, 404); return; }
  if (existing.status !== PaymentStatus.VERIFIED) {
    sendError(res, 'general.error', lang, 400);
    return;
  }

  // 1. Reverse the obligation
  if (existing.obligationId) {
    await reversePaymentFromObligation(existing.obligationId, Number(existing.amount));
  }

  // 2. Reverse special contribution obligation if linked
  if (existing.specialContributionObligationId) {
    const scObl = await prisma.specialContributionObligation.findUnique({
      where: { id: existing.specialContributionObligationId },
    });
    if (scObl) {
      const newPaid = Math.max(0, Number(scObl.amountPaid) - Number(existing.amount));
      let newStatus = 'PENDING';
      if (newPaid >= Number(scObl.amount)) newStatus = 'PAID';
      else if (newPaid > 0) newStatus = 'PARTIAL';
      await prisma.specialContributionObligation.update({
        where: { id: existing.specialContributionObligationId },
        data: { amountPaid: newPaid, status: newStatus as 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' },
      });
    }
  }

  // 3. Set payment back to PENDING and clear verification fields
  const payment = await prisma.payment.update({
    where: { id: String(req.params.id) },
    data: {
      status: PaymentStatus.PENDING,
      verifiedById: null,
      verifiedAt: null,
    },
    include: { member: { select: { fullName: true, memberId: true } } },
  });

  // 4. Add reversal ledger entry
  await recordLedgerEntry(
    existing.memberId,
    TransactionType.ADJUSTMENT,
    -Number(existing.amount),
    `Payment rollback for ${existing.paymentId}: ${reason || 'Admin rollback'}`,
    req.user!.userId
  );

  // 5. Audit log
  await createAuditEntry(
    req.user!.userId,
    'PAYMENT_ROLLED_BACK',
    'payments',
    { paymentId: existing.paymentId, amount: existing.amount, reason: reason || 'Admin rollback' },
    req.ip
  );

  sendSuccess(res, payment, 'general.success', lang);
});

// Delete a pending payment (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const existing = await prisma.payment.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) { sendError(res, 'payment.notFound', lang, 404); return; }
  if (existing.status === PaymentStatus.VERIFIED) {
    sendError(res, 'general.error', lang, 400);
    return;
  }

  await prisma.payment.delete({ where: { id: String(req.params.id) } });
  await createAuditEntry(req.user!.userId, 'PAYMENT_DELETED', 'payments', { paymentId: existing.paymentId }, req.ip);
  sendSuccess(res, null, 'general.success', lang);
});

// Bulk record payments for multiple members at once
router.post('/bulk', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { payments: bulkPayments } = req.body as {
    payments: Array<{
      memberId: string;
      amount: number;
      paymentMethod: string;
      transactionReference?: string;
      notes?: string;
    }>;
  };

  if (!Array.isArray(bulkPayments) || bulkPayments.length === 0) {
    sendError(res, 'general.validationError', lang, 400);
    return;
  }

  const recordedById = req.user!.userId;
  const results = [];

  for (const p of bulkPayments) {
    const member = await prisma.member.findUnique({ where: { id: p.memberId } });
    if (!member) continue;

    // Auto-link to oldest unpaid obligation
    const unpaidObligation = await prisma.weeklyObligation.findFirst({
      where: { memberId: p.memberId, status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
    });

    const payment = await prisma.payment.create({
      data: {
        paymentId: generatePaymentId(),
        memberId: p.memberId,
        obligationId: unpaidObligation?.id ?? undefined,
        amount: p.amount,
        paymentMethod: p.paymentMethod as PaymentMethod,
        transactionReference: p.transactionReference,
        notes: p.notes,
        recordedById,
        receiptNumber: generateReceiptNumber(),
        status: PaymentStatus.PENDING,
      },
      include: { member: { select: { fullName: true, memberId: true } } },
    });

    await recordLedgerEntry(
      p.memberId,
      TransactionType.WEEKLY_CONTRIBUTION,
      p.amount,
      `Bulk Payment ${payment.paymentId}`,
      recordedById
    );

    if (unpaidObligation) {
      await applyPaymentToObligation(unpaidObligation.id, p.amount);
    }

    results.push(payment);
  }

  await createAuditEntry(recordedById, 'BULK_PAYMENT_RECORDED', 'payments', { count: results.length }, req.ip);
  sendSuccess(res, results, 'payment.recorded', lang, 201);
});

router.get('/', authenticate, authorize('ADMIN', 'AUDITOR'), validateQuery(paginationSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { page, limit, search, status } = req.validatedQuery as { page: number; limit: number; search?: string; status?: string };

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      member: { select: { fullName: true, memberId: true } },
      recordedBy: { select: { username: true } },
      verifiedBy: { select: { username: true } },
      obligation: {
        select: {
          weekNumber: true,
          year: true,
          dueDate: true,
        },
      },
      specialContributionObligation: {
        select: {
          specialContribution: {
            select: {
              title: true,
              titleOm: true,
              type: true,
            },
          },
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { paymentDate: 'desc' },
  });

  const total = await prisma.payment.count({ where });

  sendSuccess(res, payments, 'general.success', lang, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

router.get('/my', authenticate, authorize('MEMBER'), validateQuery(paginationSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;
  const { page, limit } = req.validatedQuery as { page: number; limit: number };

  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) {
    sendError(res, 'member.notFound', lang, 404);
    return;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { memberId: member.id },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where: { memberId: member.id } }),
  ]);

  sendSuccess(res, payments, 'general.success', lang, 200, { page, limit, total });
});

router.get('/:id/receipt', authenticate, async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const payment = await prisma.payment.findUnique({
    where: { id: String(req.params.id) },
    include: {
      member: { select: { fullName: true, memberId: true } },
      recordedBy: { select: { username: true } },
      verifiedBy: { select: { username: true } },
    },
  });

  if (!payment) {
    sendError(res, 'payment.notFound', lang, 404);
    return;
  }

  if (req.user?.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId: req.user.userId } });
    if (member?.id !== payment.memberId) {
      sendError(res, 'auth.forbidden', lang, 403);
      return;
    }
  }

  sendSuccess(res, {
    receiptNumber: payment.receiptNumber,
    memberName: payment.member.fullName,
    memberId: payment.member.memberId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate,
    auditorName: payment.verifiedBy?.username || payment.recordedBy.username,
    status: payment.status,
  }, 'general.success', lang);
});

export default router;
