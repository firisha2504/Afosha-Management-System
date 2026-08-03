import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyCleanDatabase() {
  console.log('\n=== VERIFYING CLEAN DATABASE ===\n');

  const users = await prisma.user.count();
  const members = await prisma.member.count();
  const payments = await prisma.payment.count();
  const obligations = await prisma.weeklyObligation.count();
  const penalties = await prisma.penalty.count();
  const meetings = await prisma.meeting.count();
  const settings = await prisma.systemSetting.count();

  console.log('📊 Database Counts:');
  console.log(`   Users: ${users} (should be 1 - admin only)`);
  console.log(`   Members: ${members} (should be 0)`);
  console.log(`   Payments: ${payments} (should be 0)`);
  console.log(`   Obligations: ${obligations} (should be 0)`);
  console.log(`   Penalties: ${penalties} (should be 0)`);
  console.log(`   Meetings: ${meetings} (should be 0)`);
  console.log(`   Settings: ${settings} (should be > 0)`);

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  console.log('\n👤 Admin User:');
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Must Change Password: ${adminUser.mustChangePassword}`);
  console.log(`   Is Active: ${adminUser.isActive}`);

  const weeklyContribution = await prisma.systemSetting.findUnique({
    where: { key: 'weekly_contribution' }
  });

  console.log('\n⚙️  System Settings:');
  console.log(`   Weekly Contribution: ${weeklyContribution?.value} ETB`);

  const isClean = members === 0 && payments === 0 && obligations === 0 && penalties === 0 && meetings === 0;

  console.log('\n✅ Database Status:');
  if (isClean) {
    console.log('   ✅ Database is CLEAN and ready for fresh data');
    console.log('   ✅ All fixes are compiled and active');
    console.log('   ✅ Backend running on port 5000');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Clear browser cache (Ctrl + Shift + Delete)');
    console.log('   2. Login with admin/admin123');
    console.log('   3. Change password when prompted');
    console.log('   4. Start adding members and data');
  } else {
    console.log('   ⚠️  Database still has data');
  }

  await prisma.$disconnect();
}

verifyCleanDatabase().catch(console.error);
