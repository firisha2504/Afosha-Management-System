/**
 * Database Reset Script
 * 
 * WARNING: This will DELETE ALL DATA from the database!
 * Use this to restore the system to an empty state (like fresh install)
 * 
 * Usage: npx tsx reset-database.ts
 */

import prisma from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function resetDatabase() {
  console.log('🚨 WARNING: This will DELETE ALL DATA from the database!');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Starting database reset...\n');

  try {
    // Delete all data in order (respecting foreign key constraints)
    console.log('⏳ Deleting payments...');
    await prisma.payment.deleteMany();
    
    console.log('⏳ Deleting attendance records...');
    await prisma.attendance.deleteMany();
    
    console.log('⏳ Deleting penalties...');
    await prisma.penalty.deleteMany();
    
    console.log('⏳ Deleting special contribution obligations...');
    await prisma.specialContributionObligation.deleteMany();
    
    console.log('⏳ Deleting special contributions...');
    await prisma.specialContribution.deleteMany();
    
    console.log('⏳ Deleting weekly obligations...');
    await prisma.weeklyObligation.deleteMany();
    
    console.log('⏳ Deleting meetings...');
    await prisma.meeting.deleteMany();
    
    console.log('⏳ Deleting emergency contacts...');
    await prisma.emergencyContact.deleteMany();
    
    console.log('⏳ Deleting fines...');
    await prisma.fine.deleteMany();
    
    console.log('⏳ Deleting transactions...');
    await prisma.transaction.deleteMany();
    
    console.log('⏳ Deleting members...');
    await prisma.member.deleteMany();
    
    console.log('⏳ Deleting notifications...');
    await prisma.notification.deleteMany();
    
    console.log('⏳ Deleting audit logs...');
    await prisma.auditLog.deleteMany();
    
    console.log('⏳ Deleting users (except admin)...');
    await prisma.user.deleteMany({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    
    console.log('⏳ Deleting backups...');
    await prisma.backup.deleteMany();
    
    console.log('⏳ Deleting OTP codes...');
    await prisma.otpCode.deleteMany();
    
    console.log('⏳ Deleting SMS logs...');
    await prisma.smsLog.deleteMany();
    
    console.log('⏳ Deleting device tokens...');
    await prisma.deviceToken.deleteMany();
    
    console.log('⏳ Deleting refresh tokens...');
    await prisma.refreshToken.deleteMany();
    
    console.log('⏳ Deleting public content...');
    await prisma.publicContent.deleteMany();
    
    console.log('⏳ Resetting system settings to defaults...');
    await prisma.systemSetting.deleteMany();
    
    // Create default settings
    const defaultSettings = [
      { key: 'WEEKLY_CONTRIBUTION', value: '100' },
      { key: 'PENALTY_AMOUNT', value: '50' },
      { key: 'ORGANIZATION_NAME', value: 'Afosha Management System' },
      { key: 'ORGANIZATION_NAME_OM', value: 'Sirna Bulchiinsa Afosha' },
      { key: 'SMS_ENABLED', value: 'false' },
      { key: 'AUTO_PENALTY_ENABLED', value: 'true' },
    ];
    
    await prisma.systemSetting.createMany({
      data: defaultSettings
    });
    
    // Reset admin password to default (admin/admin123)
    console.log('⏳ Resetting admin password to default...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.updateMany({
      where: { role: 'ADMIN' },
      data: {
        password: hashedPassword,
        mustChangePassword: true
      }
    });
    
    console.log('\n✅ Database reset complete!');
    console.log('\n📋 System Status:');
    console.log('   - All members, payments, contributions, penalties deleted');
    console.log('   - All meetings and attendance records deleted');
    console.log('   - Settings reset to defaults');
    console.log('   - Admin password reset to: admin123');
    console.log('   - Admin will be required to change password on next login');
    console.log('\n🎯 You can now use the system as if it was freshly installed!');
    
  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
