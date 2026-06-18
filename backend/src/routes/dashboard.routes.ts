import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createAuditEntry } from '../middleware/audit.js';
import { updateSettingsSchema, paginationSchema } from '../validators/schemas.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

router.get('/admin', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const [
    totalMembers,
    activeMembers,
    pendingMembers,
    weeklyContributions,
    unpaidPenalties,
    paidPenalties,
    outstandingBalance,
    specialContributions,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: 'APPROVED' } }),
    prisma.member.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({ where: { status: 'VERIFIED', obligationId: { not: null } }, _sum: { amount: true } }),
    prisma.penalty.aggregate({ where: { status: 'OUTSTANDING' }, _sum: { amount: true } }),
    prisma.penalty.aggregate({ where: { status: { in: ['SETTLED', 'WAIVED'] } }, _sum: { amount: true } }),
    prisma.member.aggregate({ _sum: { outstandingBalance: true } }),
    prisma.specialContributionObligation.aggregate({
      where: { status: 'PAID' },
      _sum: { amountPaid: true },
    }),
  ]);

  sendSuccess(
    res,
    {
      totalMembers,
      activeMembers,
      pendingMembers,
      weeklyContributions: weeklyContributions._sum.amount || 0,
      unpaidPenalties: unpaidPenalties._sum.amount || 0,
      paidPenalties: paidPenalties._sum.amount || 0,
      totalOutstandingBalance: outstandingBalance._sum.outstandingBalance || 0,
      totalSpecialContributions: specialContributions._sum.amountPaid || 0,
    },
    'general.success',
    lang
  );
});

// Get consolidated history/logs
router.get('/history', authenticate, authorize('ADMIN', 'AUDITOR'), validateQuery(paginationSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { page, limit } = req.validatedQuery as { page: number; limit: number };

  try {
    const [payments, specialContributions, attendanceRecords] = await Promise.all([
      prisma.payment.findMany({
        include: {
          member: { select: { fullName: true, memberId: true } },
          recordedBy: { select: { username: true } },
          verifiedBy: { select: { username: true } },
          obligation: { select: { weekNumber: true, year: true } },
          specialContributionObligation: { select: { specialContribution: { select: { title: true } } } },
        },
        orderBy: { paymentDate: 'desc' },
        take: limit * page,
      }),
      prisma.specialContribution.findMany({
        include: {
          beneficiaryMember: { select: { fullName: true, memberId: true } },
          createdBy: { select: { username: true } },
          _count: { select: { obligations: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * page,
      }),
      prisma.attendance.findMany({
        include: {
          member: { select: { fullName: true, memberId: true } },
          recordedBy: { select: { username: true } },
          meeting: { select: { meetingDate: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * page,
      }),
    ]);

    // Initialize empty arrays for tables that might not exist
    const ledgerEntries: any[] = [];
    const auditEntries: any[] = [];

    sendSuccess(res, {
      payments: payments.slice((page - 1) * limit, page * limit),
      ledgerEntries: ledgerEntries.slice((page - 1) * limit, page * limit),
      auditEntries: auditEntries.slice((page - 1) * limit, page * limit),
      specialContributions: specialContributions.slice((page - 1) * limit, page * limit),
      attendanceRecords: attendanceRecords.slice((page - 1) * limit, page * limit),
      totals: {
        payments: payments.length,
        ledgerEntries: ledgerEntries.length,
        auditEntries: auditEntries.length,
        specialContributions: specialContributions.length,
        attendanceRecords: attendanceRecords.length,
      },
    }, 'general.success', lang, 200, { page, limit });
  } catch (error) {
    console.error('History endpoint error:', error);
    sendError(res, 'general.error', lang, 500);
  }
});

router.get('/auditor', authenticate, authorize('AUDITOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [weeklyCollections, outstandingPayments, recentPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: { paymentDate: { gte: weekAgo }, status: 'VERIFIED' },
      _sum: { amount: true },
    }),
    prisma.weeklyObligation.count({ where: { status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] } } }),
    prisma.payment.findMany({
      take: 10,
      orderBy: { paymentDate: 'desc' },
      include: { member: { select: { fullName: true, memberId: true } } },
    }),
  ]);

  sendSuccess(
    res,
    {
      weeklyCollections: weeklyCollections._sum.amount || 0,
      outstandingPayments,
      recentPayments,
    },
    'general.success',
    lang
  );
});

router.get('/member', authenticate, authorize('MEMBER'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const member = await prisma.member.findUnique({
    where: { userId: req.user!.userId },
    include: {
      penalties: { where: { status: 'OUTSTANDING' }, take: 5 },
      obligations: { where: { status: { in: ['PENDING', 'OVERDUE'] } }, take: 5 },
    },
  });

  if (!member) {
    sendSuccess(res, null, 'general.notFound', lang, 404);
    return;
  }

  const attendance = await prisma.attendance.findMany({ where: { memberId: member.id } });
  const present = attendance.filter((a) => a.status === 'PRESENT').length;
  const attendancePercentage = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;

  const upcomingMeetings = await prisma.meeting.findMany({
    where: { meetingDate: { gte: new Date() } },
    take: 3,
    orderBy: { meetingDate: 'asc' },
  });

  sendSuccess(
    res,
    {
      // Member identity
      fullName: member.fullName,
      memberId: member.memberId,
      status: member.status,
      profilePicture: member.profilePicture,
      // Financial
      outstandingBalance: member.outstandingBalance,
      totalPenalties: member.penalties.reduce((s, p) => s + Number(p.amount), 0),
      penalties: member.penalties,
      obligations: member.obligations,
      // Attendance
      attendancePercentage,
      // Upcoming
      upcomingMeetings,
    },
    'general.success',
    lang
  );
});

router.get('/charts', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const months: { month: string; contributions: number; penalties: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const [allPayments, penalties] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: start, lte: end }, status: 'VERIFIED' },
        select: { amount: true, notes: true },
      }),
      prisma.penalty.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ]);

    // Filter out penalty payments from contributions
    const weeklyPayments = allPayments.filter(p => !p.notes?.toLowerCase().includes('penalty'));
    const contributionsTotal = weeklyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    months.push({
      month: start.toLocaleString('en', { month: 'short' }),
      contributions: contributionsTotal,
      penalties: Number(penalties._sum.amount || 0),
    });
  }

  sendSuccess(res, { trends: months }, 'general.success', lang);
});

export default router;
