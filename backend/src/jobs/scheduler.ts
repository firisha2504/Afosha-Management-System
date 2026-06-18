import cron from 'node-cron';
import {
  createWeeklyObligations,
  markOverdueObligations,
  sendUnpaidReminders,
} from '../services/contribution.service.js';
import { sendMeetingReminderSms } from '../services/notification.service.js';
import prisma from '../config/database.js';

export function startScheduledJobs(): void {
  // Every Saturday at 6:00 AM — create weekly obligations
  cron.schedule('0 6 * * 6', async () => {
    console.log('[Cron] Creating weekly obligations...');
    const count = await createWeeklyObligations();
    console.log(`[Cron] Created ${count} obligations`);
  });

  // Every day at midnight — mark overdue obligations
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Marking overdue obligations...');
    const count = await markOverdueObligations();
    console.log(`[Cron] Marked ${count} as overdue`);
  });

  // Friday at 6 PM — meeting reminder (1 day before Saturday)
  cron.schedule('0 18 * * 5', async () => {
    console.log('[Cron] Sending meeting reminders...');
    const members = await prisma.member.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { phone: true, preferredLanguage: true } } },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('en-ET');

    for (const member of members) {
      if (member.user.phone) {
        const lang = (member.user.preferredLanguage as 'en' | 'om') || 'om';
        await sendMeetingReminderSms(member.user.phone, dateStr, lang);
      }
    }
  });

  // Saturday at 7 AM — morning meeting reminder + payment reminders
  cron.schedule('0 7 * * 6', async () => {
    console.log('[Cron] Sending Saturday morning reminders...');
    const sent = await sendUnpaidReminders();
    console.log(`[Cron] Sent ${sent} payment reminders`);
  });

  // Sunday at 1:00 AM — Create penalties for unpaid members from yesterday's meeting
  cron.schedule('0 1 * * 0', async () => {
    console.log('[Cron] Creating penalties for unpaid Saturday obligations...');
    
    try {
      // Get yesterday's date (Saturday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Calculate week number and year
      const startOfYear = new Date(yesterday.getFullYear(), 0, 1);
      const dayOfYear = Math.ceil((yesterday.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.ceil(dayOfYear / 7);
      const year = yesterday.getFullYear();
      
      console.log(`[Cron] Checking Week ${weekNumber}, ${year} for unpaid obligations...`);
      
      // Find all unpaid/partial obligations for last week
      const unpaidObligations = await prisma.weeklyObligation.findMany({
        where: {
          weekNumber,
          year,
          status: { in: ['PENDING', 'OVERDUE', 'PARTIAL'] },
        },
        include: {
          member: {
            select: { id: true, fullName: true, memberId: true },
          },
        },
      });
      
      console.log(`[Cron] Found ${unpaidObligations.length} unpaid obligations`);
      
      // Get penalty settings
      const penaltySetting = await prisma.setting.findUnique({
        where: { key: 'weekly_penalty' },
      });
      const penaltyAmount = penaltySetting ? parseFloat(penaltySetting.value) : 50;
      
      let penaltiesCreated = 0;
      
      for (const obligation of unpaidObligations) {
        // Check if penalty already exists for this member/week
        const existingPenalty = await prisma.penalty.findFirst({
          where: {
            memberId: obligation.memberId,
            weekNumber,
            year,
          },
        });
        
        if (!existingPenalty) {
          // Create penalty
          await prisma.penalty.create({
            data: {
              memberId: obligation.memberId,
              amount: penaltyAmount,
              reason: `Missed payment for Week ${weekNumber}, ${year}`,
              weekNumber,
              year,
              isMonthly: false,
              status: 'OUTSTANDING',
            },
          });
          
          // Update member's outstanding balance
          await prisma.member.update({
            where: { id: obligation.memberId },
            data: {
              outstandingBalance: { increment: penaltyAmount },
            },
          });
          
          penaltiesCreated++;
          console.log(`[Cron] Created penalty for ${obligation.member.fullName} (${obligation.member.memberId})`);
        }
      }
      
      console.log(`[Cron] Created ${penaltiesCreated} penalties for Week ${weekNumber}`);
    } catch (error) {
      console.error('[Cron] Error creating penalties:', error);
    }
  });

  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running daily backup...');
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { config } = await import('../config/index.js');

      const filename = `auto-backup-${Date.now()}.json`;
      const backupData = {
        timestamp: new Date().toISOString(),
        members: await prisma.member.findMany(),
        payments: await prisma.payment.findMany(),
      };

      await fs.mkdir(config.backup.dir, { recursive: true });
      const filePath = path.join(config.backup.dir, filename);
      const content = JSON.stringify(backupData);
      await fs.writeFile(filePath, content);

      await prisma.backup.create({
        data: {
          filename,
          filePath,
          fileSize: Buffer.byteLength(content),
          type: 'automatic',
        },
      });
      console.log('[Cron] Daily backup completed');
    } catch (error) {
      console.error('[Cron] Backup failed:', error);
    }
  });

  console.log('[Cron] Scheduled jobs started');
}
