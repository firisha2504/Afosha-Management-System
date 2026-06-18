import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createAuditEntry } from '../middleware/audit.js';
import { updateSettingsSchema, paginationSchema, bulkSmsSchema, announcementSchema } from '../validators/schemas.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { config } from '../config/index.js';
import { exportToExcel, exportToPdf } from '../services/export.service.js';
import { t, Language } from '../utils/i18n.js';
import { sendSms } from '../services/notification.service.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  sendSuccess(res, settings, 'general.success', lang);
});

router.put('/', authenticate, authorize('ADMIN'), validateBody(updateSettingsSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { settings } = req.body;

  await Promise.all(
    settings.map((s: { key: string; value: string }) =>
      prisma.systemSetting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value },
        update: { value: s.value },
      })
    )
  );

  await createAuditEntry(req.user!.userId, 'SETTINGS_UPDATED', 'settings', { settings }, req.ip);
  sendSuccess(res, null, 'general.success', lang);
});

router.get('/audit-logs', authenticate, authorize('ADMIN'), validateQuery(paginationSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { page, limit } = req.validatedQuery as { page: number; limit: number };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { username: true, role: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count(),
  ]);

  sendSuccess(res, logs, 'general.success', lang, 200, { page, limit, total });
});

router.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;

  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  sendSuccess(res, notifications, 'general.success', lang);
});

router.patch('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  await prisma.notification.update({
    where: { id: String(req.params.id) },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'general.success', lang);
});

router.delete('/notifications/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const notification = await prisma.notification.findUnique({ where: { id: String(req.params.id) } });
  if (!notification) { sendError(res, 'general.notFound', lang, 404); return; }
  if (notification.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    sendError(res, 'general.unauthorized', lang, 403);
    return;
  }
  await prisma.notification.delete({ where: { id: String(req.params.id) } });
  sendSuccess(res, null, 'general.success', lang);
});

router.patch('/notifications/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { title, message } = req.body;
  const notification = await prisma.notification.findUnique({ where: { id: String(req.params.id) } });
  if (!notification) { sendError(res, 'general.notFound', lang, 404); return; }
  
  const updated = await prisma.notification.update({
    where: { id: String(req.params.id) },
    data: {
      ...(title !== undefined && { title, titleOm: title }),
      ...(message !== undefined && { message, messageOm: message }),
    },
  });
  sendSuccess(res, updated, 'general.success', lang);
});

router.get('/reports/:type', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { type } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };

  let data: unknown;

  switch (type) {
    case 'unpaid': {
      // Fetch all unpaid/partial/overdue obligations
      const [weeklyObligations, specialObligations, penalties] = await Promise.all([
        prisma.weeklyObligation.findMany({
          where: { 
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            member: { status: 'APPROVED' } // Only active members
          },
          select: {
            id: true,
            weekNumber: true,
            year: true,
            contributionAmount: true,
            penaltyAmount: true,
            totalDue: true,
            amountPaid: true,
            status: true,
            dueDate: true,
            member: { 
              select: { 
                id: true,
                fullName: true, 
                memberId: true,
                outstandingBalance: true,
                user: { select: { phone: true } }
              } 
            },
          },
          orderBy: [{ dueDate: 'asc' }, { member: { fullName: 'asc' } }],
        }),
        prisma.specialContributionObligation.findMany({
          where: { 
            status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
            isExempt: false,
            member: { status: 'APPROVED' } // Only active members
          },
          select: {
            id: true,
            amount: true,
            amountPaid: true,
            status: true,
            specialContribution: { 
              select: { 
                title: true, 
                titleOm: true, 
                type: true, 
                dueDate: true,
                campaignId: true
              } 
            },
            member: { 
              select: { 
                id: true,
                fullName: true, 
                memberId: true,
                outstandingBalance: true,
                user: { select: { phone: true } }
              } 
            },
          },
          orderBy: [{ specialContribution: { dueDate: 'asc' } }, { member: { fullName: 'asc' } }],
        }),
        prisma.penalty.findMany({
          where: { 
            status: 'OUTSTANDING',
            member: { status: 'APPROVED' } // Only active members
          },
          select: {
            id: true,
            amount: true,
            reason: true,
            weekNumber: true,
            year: true,
            isMonthly: true,
            status: true,
            createdAt: true,
            member: { 
              select: { 
                id: true,
                fullName: true, 
                memberId: true,
                outstandingBalance: true,
                user: { select: { phone: true } }
              } 
            },
          },
          orderBy: [{ createdAt: 'desc' }, { member: { fullName: 'asc' } }],
        }),
      ]);

      // Calculate totals
      const weeklyUnpaid = weeklyObligations.reduce((sum, o) => 
        sum + (Number(o.totalDue) - Number(o.amountPaid)), 0
      );
      const specialUnpaid = specialObligations.reduce((sum, o) => 
        sum + (Number(o.amount) - Number(o.amountPaid)), 0
      );
      const penaltiesUnpaid = penalties.reduce((sum, p) => 
        sum + Number(p.amount), 0
      );

      // Get unique members with unpaid contributions
      const uniqueMemberIds = new Set([
        ...weeklyObligations.map(o => o.member.id),
        ...specialObligations.map(o => o.member.id),
        ...penalties.map(p => p.member.id)
      ]);

      data = {
        summary: {
          weeklyCount: weeklyObligations.length,
          specialCount: specialObligations.length,
          penaltiesCount: penalties.length,
          weeklyUnpaidAmount: weeklyUnpaid,
          specialUnpaidAmount: specialUnpaid,
          penaltiesUnpaidAmount: penaltiesUnpaid,
          totalUnpaidAmount: weeklyUnpaid + specialUnpaid + penaltiesUnpaid,
          uniqueMembers: uniqueMemberIds.size,
        },
        weeklyObligations,
        specialObligations,
        penalties,
      };
      break;
    }
    case 'contributions':
      data = await prisma.payment.findMany({
        where: { paymentDate: dateFilter, status: 'VERIFIED' },
        include: { member: { select: { fullName: true, memberId: true } } },
        orderBy: { paymentDate: 'desc' },
      });
      break;
    case 'penalties':
      data = await prisma.penalty.findMany({
        where: { createdAt: dateFilter },
        include: { member: { select: { fullName: true, memberId: true } } },
        orderBy: { createdAt: 'desc' },
      });
      break;
    case 'attendance':
      data = await prisma.attendance.findMany({
        where: { createdAt: dateFilter },
        include: {
          member: { select: { fullName: true, memberId: true } },
          meeting: { select: { title: true, meetingDate: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      break;
    case 'special-contributions':
      data = await prisma.specialContribution.findMany({
        where: { createdAt: dateFilter },
        include: {
          beneficiaryMember: { select: { fullName: true, memberId: true } },
          _count: { select: { obligations: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      break;
    case 'year-end': {
      const year = new Date().getFullYear();
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);

      const [contributions, penalties, attendanceCount, topContributors, outstanding] =
        await Promise.all([
          prisma.payment.aggregate({
            where: { paymentDate: { gte: yearStart, lte: yearEnd }, status: 'VERIFIED' },
            _sum: { amount: true },
          }),
          prisma.penalty.aggregate({
            where: { createdAt: { gte: yearStart, lte: yearEnd } },
            _sum: { amount: true },
          }),
          prisma.attendance.count({ where: { createdAt: { gte: yearStart, lte: yearEnd } } }),
          prisma.payment.groupBy({
            by: ['memberId'],
            where: { paymentDate: { gte: yearStart, lte: yearEnd }, status: 'VERIFIED' },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 10,
          }),
          prisma.member.aggregate({ _sum: { outstandingBalance: true } }),
        ]);

      data = {
        year,
        totalContributions: contributions._sum.amount || 0,
        totalPenalties: penalties._sum.amount || 0,
        totalAttendance: attendanceCount,
        topContributors,
        outstandingBalances: outstanding._sum.outstandingBalance || 0,
      };
      break;
    }
    default:
      data = [];
  }

  sendSuccess(res, data, 'general.success', lang);
});

router.get('/reports/:type/export', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = (req.lang || 'om') as Language;
  const { type } = req.params;
  const { format = 'excel', from, to } = req.query as { format?: string; from?: string; to?: string };

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };

  type ExportConfig = {
    title: string;
    pdfHeaders: string[];
    pdfRows: string[][];
    excelColumns: { header: string; key: string; width?: number }[];
    excelRows: Record<string, unknown>[];
  };

  let exportConfig: ExportConfig | null = null;

  switch (type) {
    case 'contributions': {
      const payments = await prisma.payment.findMany({
        where: { paymentDate: dateFilter, status: 'VERIFIED' },
        include: { member: { select: { fullName: true, memberId: true } } },
        orderBy: { paymentDate: 'desc' },
      });
      exportConfig = {
        title: t(lang, 'reports.titleContributions'),
        pdfHeaders: [
          t(lang, 'reports.headerMemberId'),
          t(lang, 'reports.headerName'),
          t(lang, 'reports.headerAmount'),
          t(lang, 'reports.headerMethod'),
          t(lang, 'reports.headerDate'),
        ],
        pdfRows: payments.map((p) => [
          p.member.memberId,
          p.member.fullName,
          String(p.amount),
          p.paymentMethod,
          new Date(p.paymentDate).toLocaleDateString(),
        ]),
        excelColumns: [
          { header: t(lang, 'reports.headerMemberId'), key: 'memberId', width: 15 },
          { header: t(lang, 'reports.headerName'), key: 'name', width: 25 },
          { header: t(lang, 'reports.headerAmount'), key: 'amount', width: 12 },
          { header: t(lang, 'reports.headerMethod'), key: 'method', width: 15 },
          { header: t(lang, 'reports.headerDate'), key: 'date', width: 15 },
        ],
        excelRows: payments.map((p) => ({
          memberId: p.member.memberId,
          name: p.member.fullName,
          amount: Number(p.amount),
          method: p.paymentMethod,
          date: new Date(p.paymentDate).toLocaleDateString(),
        })),
      };
      break;
    }
    case 'penalties': {
      const penalties = await prisma.penalty.findMany({
        where: { createdAt: dateFilter },
        include: { member: { select: { fullName: true, memberId: true } } },
        orderBy: { createdAt: 'desc' },
      });
      exportConfig = {
        title: t(lang, 'reports.titlePenalties'),
        pdfHeaders: [
          t(lang, 'reports.headerMemberId'),
          t(lang, 'reports.headerName'),
          t(lang, 'reports.headerAmount'),
          t(lang, 'reports.headerReason'),
          t(lang, 'reports.headerDate'),
        ],
        pdfRows: penalties.map((p) => [
          p.member.memberId,
          p.member.fullName,
          String(p.amount),
          p.reason,
          new Date(p.createdAt).toLocaleDateString(),
        ]),
        excelColumns: [
          { header: t(lang, 'reports.headerMemberId'), key: 'memberId', width: 15 },
          { header: t(lang, 'reports.headerName'), key: 'name', width: 25 },
          { header: t(lang, 'reports.headerAmount'), key: 'amount', width: 12 },
          { header: t(lang, 'reports.headerReason'), key: 'reason', width: 25 },
          { header: t(lang, 'reports.headerDate'), key: 'date', width: 15 },
        ],
        excelRows: penalties.map((p) => ({
          memberId: p.member.memberId,
          name: p.member.fullName,
          amount: Number(p.amount),
          reason: p.reason,
          date: new Date(p.createdAt).toLocaleDateString(),
        })),
      };
      break;
    }
    case 'attendance': {
      const records = await prisma.attendance.findMany({
        where: { createdAt: dateFilter },
        include: {
          member: { select: { fullName: true, memberId: true } },
          meeting: { select: { title: true, meetingDate: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      exportConfig = {
        title: t(lang, 'reports.titleAttendance'),
        pdfHeaders: [
          t(lang, 'reports.headerMemberId'),
          t(lang, 'reports.headerName'),
          t(lang, 'reports.headerMeeting'),
          t(lang, 'reports.headerStatus'),
          t(lang, 'reports.headerDate'),
        ],
        pdfRows: records.map((r) => [
          r.member.memberId,
          r.member.fullName,
          r.meeting.title,
          r.status,
          new Date(r.meeting.meetingDate).toLocaleDateString(),
        ]),
        excelColumns: [
          { header: t(lang, 'reports.headerMemberId'), key: 'memberId', width: 15 },
          { header: t(lang, 'reports.headerName'), key: 'name', width: 25 },
          { header: t(lang, 'reports.headerMeeting'), key: 'meeting', width: 25 },
          { header: t(lang, 'reports.headerStatus'), key: 'status', width: 12 },
          { header: t(lang, 'reports.headerDate'), key: 'date', width: 15 },
        ],
        excelRows: records.map((r) => ({
          memberId: r.member.memberId,
          name: r.member.fullName,
          meeting: r.meeting.title,
          status: r.status,
          date: new Date(r.meeting.meetingDate).toLocaleDateString(),
        })),
      };
      break;
    }
    case 'special-contributions': {
      const items = await prisma.specialContribution.findMany({
        where: { createdAt: dateFilter },
        include: {
          beneficiaryMember: { select: { fullName: true, memberId: true } },
          _count: { select: { obligations: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      exportConfig = {
        title: t(lang, 'reports.titleSpecialContributions'),
        pdfHeaders: [
          t(lang, 'reports.headerType'),
          t(lang, 'reports.headerBeneficiary'),
          t(lang, 'reports.headerAmount'),
          t(lang, 'reports.headerObligations'),
          t(lang, 'reports.headerDate'),
        ],
        pdfRows: items.map((i) => [
          i.type,
          i.beneficiaryMember?.fullName ?? '-',
          String(i.amount),
          String(i._count.obligations),
          new Date(i.createdAt).toLocaleDateString(),
        ]),
        excelColumns: [
          { header: t(lang, 'reports.headerType'), key: 'type', width: 15 },
          { header: t(lang, 'reports.headerBeneficiary'), key: 'beneficiary', width: 25 },
          { header: t(lang, 'reports.headerAmount'), key: 'amount', width: 12 },
          { header: t(lang, 'reports.headerObligations'), key: 'obligations', width: 12 },
          { header: t(lang, 'reports.headerDate'), key: 'date', width: 15 },
        ],
        excelRows: items.map((i) => ({
          type: i.type,
          beneficiary: i.beneficiaryMember?.fullName ?? '-',
          amount: Number(i.amount),
          obligations: i._count.obligations,
          date: new Date(i.createdAt).toLocaleDateString(),
        })),
      };
      break;
    }
    case 'year-end': {
      const year = new Date().getFullYear();
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);
      const [contributions, penalties, attendanceCount, outstanding] = await Promise.all([
        prisma.payment.aggregate({
          where: { paymentDate: { gte: yearStart, lte: yearEnd }, status: 'VERIFIED' },
          _sum: { amount: true },
        }),
        prisma.penalty.aggregate({
          where: { createdAt: { gte: yearStart, lte: yearEnd } },
          _sum: { amount: true },
        }),
        prisma.attendance.count({ where: { createdAt: { gte: yearStart, lte: yearEnd } } }),
        prisma.member.aggregate({ _sum: { outstandingBalance: true } }),
      ]);
      const summary = [
        { metric: t(lang, 'reports.metricYear'), value: String(year) },
        { metric: t(lang, 'reports.metricTotalContributions'), value: String(contributions._sum.amount || 0) },
        { metric: t(lang, 'reports.metricTotalPenalties'), value: String(penalties._sum.amount || 0) },
        { metric: t(lang, 'reports.metricAttendanceRecords'), value: String(attendanceCount) },
        { metric: t(lang, 'reports.metricOutstandingBalances'), value: String(outstanding._sum.outstandingBalance || 0) },
      ];
      exportConfig = {
        title: `${t(lang, 'reports.titleYearEnd')} ${year}`,
        pdfHeaders: [t(lang, 'reports.headerMetric'), t(lang, 'reports.headerValue')],
        pdfRows: summary.map((s) => [s.metric, s.value]),
        excelColumns: [
          { header: t(lang, 'reports.headerMetric'), key: 'metric', width: 30 },
          { header: t(lang, 'reports.headerValue'), key: 'value', width: 20 },
        ],
        excelRows: summary,
      };
      break;
    }
  }

  if (!exportConfig) {
    res.status(400).json({ success: false, message: 'Export not supported for this report type' });
    return;
  }

  const filename = `${type}-${Date.now()}`;
  if (format === 'pdf') {
    exportToPdf(res, filename, exportConfig.title, exportConfig.pdfHeaders, exportConfig.pdfRows, lang);
    return;
  }

  await exportToExcel(res, filename, exportConfig.excelColumns, exportConfig.excelRows, lang);
});

router.post('/announcements', authenticate, authorize('ADMIN'), validateBody(announcementSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { title, titleOm, message, messageOm } = req.body;

  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: 'SYSTEM_ANNOUNCEMENT' as const,
      title,
      titleOm: titleOm ?? title,
      message,
      messageOm: messageOm ?? message,
    })),
  });

  await createAuditEntry(req.user!.userId, 'ANNOUNCEMENT_CREATED', 'notifications', { title }, req.ip);
  sendSuccess(res, { sent: users.length }, 'general.success', lang, 201);
});

router.post('/sms/bulk', authenticate, authorize('ADMIN'), validateBody(bulkSmsSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { message, phones, sendToAll } = req.body;

  let targetPhones: string[] = phones ?? [];
  if (sendToAll) {
    const members = await prisma.member.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { phone: true } } },
    });
    targetPhones = members.map((m) => m.user.phone).filter(Boolean) as string[];
  }

  let sent = 0;
  for (const phone of targetPhones) {
    const ok = await sendSms(phone, message);
    if (ok) sent++;
  }

  await createAuditEntry(req.user!.userId, 'BULK_SMS_SENT', 'sms', { count: sent }, req.ip);
  sendSuccess(res, { sent, total: targetPhones.length }, 'general.success', lang);
});

router.post('/backups/:id/restore', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const backup = await prisma.backup.findUnique({ where: { id: String(req.params.id) } });
  if (!backup) {
    sendError(res, 'general.notFound', lang, 404);
    return;
  }

  const fs = await import('fs/promises');
  const content = await fs.readFile(backup.filePath, 'utf-8');
  const data = JSON.parse(content) as {
    settings?: Array<{ key: string; value: string }>;
    members?: Array<{ id: string; outstandingBalance?: number | string }>;
    payments?: Array<{ id: string; memberId: string; [key: string]: unknown }>;
  };

  let settingsRestored = 0;
  let membersRestored = 0;
  let paymentsRestored = 0;

  if (data.settings?.length) {
    for (const s of data.settings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        create: { key: s.key, value: s.value },
        update: { value: s.value },
      });
      settingsRestored++;
    }
  }

  if (data.members?.length) {
    for (const m of data.members) {
      const existing = await prisma.member.findUnique({ where: { id: m.id } });
      if (!existing) continue;
      await prisma.member.update({
        where: { id: m.id },
        data: {
          outstandingBalance: m.outstandingBalance ?? existing.outstandingBalance,
        },
      });
      membersRestored++;
    }
  }

  if (data.payments?.length) {
    for (const p of data.payments) {
      const existing = await prisma.payment.findUnique({ where: { id: p.id } });
      if (!existing) continue;
      await prisma.payment.update({
        where: { id: p.id },
        data: {
          amount: p.amount !== undefined ? Number(p.amount) : undefined,
          status: typeof p.status === 'string' ? (p.status as 'PENDING' | 'VERIFIED' | 'REJECTED') : undefined,
          notes: typeof p.notes === 'string' ? p.notes : undefined,
        },
      });
      paymentsRestored++;
    }
  }

  await createAuditEntry(req.user!.userId, 'BACKUP_RESTORED', 'backup', { filename: backup.filename }, req.ip);
  sendSuccess(
    res,
    {
      restored: true,
      settingsRestored,
      membersRestored,
      paymentsRestored,
      note: 'Settings, member balances, and payment records restored where possible',
    },
    'general.success',
    lang
  );
});

router.post('/backups', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const filename = `backup-${Date.now()}.json`;

  const backupData = {
    timestamp: new Date().toISOString(),
    members: await prisma.member.findMany(),
    payments: await prisma.payment.findMany(),
    settings: await prisma.systemSetting.findMany(),
  };

  const fs = await import('fs/promises');
  const path = await import('path');
  const backupDir = config.backup.dir;
  await fs.mkdir(backupDir, { recursive: true });
  const filePath = path.join(backupDir, filename);
  const content = JSON.stringify(backupData, null, 2);
  await fs.writeFile(filePath, content);

  const backup = await prisma.backup.create({
    data: {
      filename,
      filePath,
      fileSize: Buffer.byteLength(content),
      type: 'manual',
      createdBy: req.user!.userId,
    },
  });

  await createAuditEntry(req.user!.userId, 'BACKUP_CREATED', 'backup', { filename }, req.ip);
  sendSuccess(res, backup, 'general.success', lang, 201);
});

router.get('/backups', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const backups = await prisma.backup.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, backups, 'general.success', lang);
});

export default router;
