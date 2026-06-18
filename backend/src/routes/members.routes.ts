import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { AuthRequest, authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createAuditEntry } from '../middleware/audit.js';
import {
  generateMemberId,
  hashPassword,
} from '../services/helpers.js';
import {
  registerMemberSchema,
  adminRegisterMemberSchema,
  createAuditorSchema,
  approveMemberSchema,
  updateProfileSchema,
  paginationSchema,
} from '../validators/schemas.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/register', validateBody(registerMemberSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const data = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
  });

  if (existing) {
    sendError(res, 'general.error', lang, 409);
    return;
  }

  const passwordHash = await hashPassword(data.password);
  const memberId = generateMemberId();

  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      email: data.email,
      passwordHash,
      role: 'MEMBER',
      isActive: true,
      isVerified: false,
      member: {
        create: {
          memberId,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address,
          occupation: data.occupation,
          status: 'PENDING',
          emergencyContact: {
            create: data.emergencyContact,
          },
        },
      },
    },
    include: { member: true },
  });

  sendSuccess(res, { memberId: user.member?.memberId, status: 'PENDING' }, 'member.registered', lang, 201);
});

// Admin registers a member directly — status set to APPROVED immediately
router.post('/admin-register', authenticate, authorize('ADMIN'), validateBody(adminRegisterMemberSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const data = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
  });

  if (existing) {
    sendError(res, 'general.error', lang, 409);
    return;
  }

  const passwordHash = await hashPassword(data.password);
  const memberId = generateMemberId();

  const user = await prisma.user.create({
    data: {
      phone: data.phone,
      email: data.email,
      passwordHash,
      role: 'MEMBER',
      isActive: true,
      isVerified: true,
      member: {
        create: {
          memberId,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address,
          occupation: data.occupation,
          status: 'APPROVED',
          ...(data.emergencyContact ? {
            emergencyContact: {
              create: data.emergencyContact,
            },
          } : {}),
        },
      },
    },
    include: { member: true },
  });

  await createAuditEntry(req.user!.userId, 'MEMBER_ADMIN_REGISTERED', 'members', { memberId }, req.ip);

  sendSuccess(res, {
    memberId: user.member?.memberId,
    fullName: data.fullName,
    phone: data.phone,
    password: data.password, // returned once so admin can share credentials
    status: 'APPROVED',
  }, 'member.approved', lang, 201);
});

router.get('/', authenticate, authorize('ADMIN', 'AUDITOR'), validateQuery(paginationSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { page, limit, search, status } = req.validatedQuery as { page: number; limit: number; search?: string; status?: string };

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { memberId: { contains: search, mode: 'insensitive' } },
      { user: { phone: { contains: search } } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: {
        user: { select: { phone: true, email: true, isActive: true } },
        emergencyContact: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.member.count({ where }),
  ]);

  sendSuccess(res, members, 'general.success', lang, 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

router.get('/me', authenticate, authorize('MEMBER'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;

  const member = await prisma.member.findUnique({
    where: { userId },
    include: {
      user: { select: { phone: true, email: true, preferredLanguage: true } },
      emergencyContact: true,
    },
  });

  if (!member) {
    sendError(res, 'member.notFound', lang, 404);
    return;
  }

  sendSuccess(res, member, 'general.success', lang);
});

// Create an auditor (ADMIN only)
router.post('/auditors', authenticate, authorize('ADMIN'), validateBody(createAuditorSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { username, phone, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, ...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])] },
  });

  if (existing) {
    sendError(res, 'general.error', lang, 409);
    return;
  }

  const passwordHash = await hashPassword(password);
  const auditor = await prisma.user.create({
    data: {
      username,
      phone,
      email,
      passwordHash,
      role: 'AUDITOR',
      isActive: true,
      isVerified: true,
    },
    select: { id: true, username: true, phone: true, email: true, role: true, createdAt: true },
  });

  await createAuditEntry(req.user!.userId, 'AUDITOR_CREATED', 'members', { auditorId: auditor.id }, req.ip);

  sendSuccess(res, auditor, 'general.success', lang, 201);
});

// List all auditors
router.get('/auditors', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const auditors = await prisma.user.findMany({
    where: { role: 'AUDITOR' },
    select: { id: true, username: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // Attach profile pictures from systemSettings
  const withPictures = await Promise.all(auditors.map(async (a) => {
    const avatar = await prisma.systemSetting.findUnique({ where: { key: `user_avatar_${a.id}` } });
    return { ...a, profilePicture: avatar?.value || null };
  }));

  sendSuccess(res, withPictures, 'general.success', lang);
});

// Edit an auditor (ADMIN only)
router.patch('/auditors/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { username, phone, email, isActive } = req.body;
  const id = String(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== 'AUDITOR') {
    sendError(res, 'general.notFound', lang, 404);
    return;
  }

  // Uniqueness checks
  if (username) {
    const dup = await prisma.user.findFirst({ where: { username, NOT: { id } } });
    if (dup) { sendError(res, 'general.error', lang, 409); return; }
  }
  if (phone) {
    const dup = await prisma.user.findFirst({ where: { phone, NOT: { id } } });
    if (dup) { sendError(res, 'general.error', lang, 409); return; }
  }
  if (email) {
    const dup = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (dup) { sendError(res, 'general.error', lang, 409); return; }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(username !== undefined && { username }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, username: true, phone: true, email: true, role: true, isActive: true },
  });

  await createAuditEntry(req.user!.userId, 'AUDITOR_UPDATED', 'members', { auditorId: id }, req.ip);
  sendSuccess(res, updated, 'general.success', lang);
});

// Reset auditor password (ADMIN only)
router.patch('/auditors/:id/reset-password', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { newPassword } = req.body;
  const id = String(req.params.id);

  if (!newPassword || newPassword.length < 8) {
    sendError(res, 'general.validationError', lang, 400);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== 'AUDITOR') {
    sendError(res, 'general.notFound', lang, 404);
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await createAuditEntry(req.user!.userId, 'AUDITOR_PASSWORD_RESET', 'members', { auditorId: id }, req.ip);
  sendSuccess(res, { reset: true }, 'general.success', lang);
});

// Delete an auditor (ADMIN only)
router.delete('/auditors/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const id = String(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== 'AUDITOR') {
    sendError(res, 'general.notFound', lang, 404);
    return;
  }

  await prisma.user.delete({ where: { id } });
  await createAuditEntry(req.user!.userId, 'AUDITOR_DELETED', 'members', { auditorId: id }, req.ip);
  sendSuccess(res, null, 'general.success', lang);
});

router.get('/:id', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';

  const member = await prisma.member.findUnique({
    where: { id: String(req.params.id) },
    include: {
      user: { select: { phone: true, email: true, isActive: true } },
      emergencyContact: true,
      penalties: { orderBy: { createdAt: 'desc' }, take: 10 },
      savingsRecords: { orderBy: { savingsDate: 'desc' }, take: 10 },
    },
  });

  if (!member) {
    sendError(res, 'member.notFound', lang, 404);
    return;
  }

  sendSuccess(res, member, 'general.success', lang);
});

router.patch('/:id/approve', authenticate, authorize('ADMIN'), validateBody(approveMemberSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { status, rejectionReason } = req.body;

  const member = await prisma.member.update({
    where: { id: String(req.params.id) },
    data: { status, rejectionReason },
  });

  await createAuditEntry(req.user!.userId, `MEMBER_${status}`, 'members', { memberId: member.memberId }, req.ip);

  const messageKey = status === 'APPROVED' ? 'member.approved' : 'member.rejected';
  sendSuccess(res, member, messageKey, lang);
});

router.patch('/me/profile', authenticate, authorize('MEMBER'), validateBody(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;
  const { fullName, gender, dateOfBirth, phone, email, address, occupation, emergencyContact } = req.body;

  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) {
    sendError(res, 'member.notFound', lang, 404);
    return;
  }

  // Check phone uniqueness if changing
  if (phone) {
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
    });
    if (existing) {
      sendError(res, 'general.error', lang, 409);
      return;
    }
  }

  // Check email uniqueness if changing
  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (existing) {
      sendError(res, 'general.error', lang, 409);
      return;
    }
  }

  // Update User (phone, email)
  if (phone || email !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(phone ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    });
  }

  // Update Member fields
  const updated = await prisma.member.update({
    where: { id: member.id },
    data: {
      ...(fullName ? { fullName } : {}),
      ...(gender ? { gender } : {}),
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(occupation !== undefined ? { occupation } : {}),
    },
    include: {
      user: { select: { phone: true, email: true } },
      emergencyContact: true,
    },
  });

  if (emergencyContact) {
    await prisma.emergencyContact.upsert({
      where: { memberId: member.id },
      create: { memberId: member.id, ...emergencyContact },
      update: emergencyContact,
    });
  }

  sendSuccess(res, updated, 'member.updated', lang);
});

// Profile picture — open to all authenticated users
router.post('/me/profile-picture', authenticate, upload.single('picture'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;

  if (!req.file) {
    sendError(res, 'general.validationError', lang, 400);
    return;
  }

  const profilePicture = `/uploads/${req.file.filename}`;

  // Members: save on Member record
  if (req.user?.role === 'MEMBER') {
    const member = await prisma.member.findUnique({ where: { userId } });
    if (!member) {
      sendError(res, 'member.notFound', lang, 404);
      return;
    }
    const updated = await prisma.member.update({
      where: { id: member.id },
      data: { profilePicture },
    });
    sendSuccess(res, { profilePicture: updated.profilePicture }, 'member.updated', lang);
    return;
  }

  // Admin/Auditor: save on User record (using a JSON metadata field or we reuse the same column name via a workaround)
  // Store in a systemSetting keyed by userId for simplicity since User has no profilePicture field
  await prisma.systemSetting.upsert({
    where: { key: `user_avatar_${userId}` },
    create: { key: `user_avatar_${userId}`, value: profilePicture, label: 'User Avatar' },
    update: { value: profilePicture },
  });
  sendSuccess(res, { profilePicture }, 'member.updated', lang);
});

// Admin/Auditor profile — get own info
router.get('/me/account', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, phone: true, email: true, role: true, preferredLanguage: true, createdAt: true },
  });

  if (!user) { sendError(res, 'member.notFound', lang, 404); return; }

  // Get avatar if set
  const avatarSetting = await prisma.systemSetting.findUnique({ where: { key: `user_avatar_${userId}` } });
  sendSuccess(res, { ...user, profilePicture: avatarSetting?.value || null }, 'general.success', lang);
});

// Admin/Auditor profile — update own info
router.patch('/me/account', authenticate, authorize('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const userId = req.user!.userId;
  const { phone, email, username } = req.body;

  // Check uniqueness
  if (phone) {
    const existing = await prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
    if (existing) { sendError(res, 'general.error', lang, 409); return; }
  }
  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (existing) { sendError(res, 'general.error', lang, 409); return; }
  }
  if (username) {
    const existing = await prisma.user.findFirst({ where: { username, NOT: { id: userId } } });
    if (existing) { sendError(res, 'general.error', lang, 409); return; }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
    },
    select: { id: true, username: true, phone: true, email: true, role: true },
  });

  sendSuccess(res, updated, 'member.updated', lang);
});

router.post('/me/device-token', authenticate, authorize('MEMBER'), async (req: AuthRequest, res: Response) => {
  const lang = req.lang || 'om';
  const { token, platform } = req.body as { token?: string; platform?: string };

  if (!token) {
    sendError(res, 'general.validationError', lang, 400);
    return;
  }

  await prisma.deviceToken.upsert({
    where: { token },
    create: { token, userId: req.user!.userId, platform: platform ?? 'unknown' },
    update: { userId: req.user!.userId, platform: platform ?? 'unknown' },
  });

  sendSuccess(res, { registered: true }, 'general.success', lang);
});

export default router;
