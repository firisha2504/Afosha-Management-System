import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTransactions() {
  console.log('🔥 Starting transaction data reset...');
  console.log('⚠️  This will delete all payments, penalties, obligations, contributions, attendance, and audit logs');
  console.log('✅ Members and Users will be PRESERVED\n');

  try {
    // Delete in correct order to respect foreign key constraints
    
    console.log('Deleting attendance records...');
    await prisma.attendance.deleteMany({});
    
    console.log('Deleting payments...');
    await prisma.payment.deleteMany({});
    
    console.log('Deleting special contribution obligations...');
    await prisma.specialContributionObligation.deleteMany({});
    
    console.log('Deleting special contributions...');
    await prisma.specialContribution.deleteMany({});
    
    console.log('Deleting weekly obligations...');
    await prisma.weeklyObligation.deleteMany({});
    
    console.log('Deleting penalties...');
    await prisma.penalty.deleteMany({});
    
    console.log('Deleting ledger entries...');
    await prisma.ledgerEntry.deleteMany({});
    
    console.log('Deleting audit logs...');
    await prisma.auditLog.deleteMany({});
    
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});
    
    console.log('Deleting meetings...');
    await prisma.meeting.deleteMany({});
    
    console.log('Resetting member balances to 0...');
    await prisma.member.updateMany({
      data: {
        outstandingBalance: 0,
        totalContributions: 0,
      },
    });
    
    console.log('\n✅ Transaction data reset completed successfully!');
    console.log('📋 Preserved:');
    console.log('   - All members');
    console.log('   - All users');
    console.log('   - All settings');
    console.log('\n🔄 You can now start fresh with clean records!');
    
  } catch (error) {
    console.error('❌ Error resetting transaction data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetTransactions()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
