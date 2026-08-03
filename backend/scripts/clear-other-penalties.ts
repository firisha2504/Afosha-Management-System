import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clear "other penalty" payments (payments not linked to any obligation)
 * These are old/standalone penalty payments that should be removed
 */
async function clearOtherPenalties() {
  console.log('========================================');
  console.log('CLEARING OTHER PENALTY PAYMENTS');
  console.log('========================================\n');

  try {
    // Find all "other penalty" payments (not linked to any obligation)
    const otherPayments = await prisma.payment.findMany({
      where: {
        status: 'VERIFIED',
        obligationId: null,
        specialContributionObligationId: null
      },
      include: {
        member: { select: { fullName: true, memberId: true, outstandingBalance: true } }
      },
      orderBy: { paymentDate: 'asc' }
    });

    console.log(`Found ${otherPayments.length} "other penalty" payments\n`);

    if (otherPayments.length === 0) {
      console.log('✅ No "other penalty" payments to clear. All clean!');
      return;
    }

    // Show what will be deleted
    console.log('Payments to be deleted:');
    console.log('─────────────────────────────────────────────────');
    
    let totalAmount = 0;
    for (const payment of otherPayments) {
      console.log(`\n  Member: ${payment.member.fullName} (${payment.member.memberId})`);
      console.log(`  Amount: ${payment.amount} ETB`);
      console.log(`  Date: ${payment.paymentDate.toLocaleDateString()}`);
      console.log(`  Notes: ${payment.notes || 'No notes'}`);
      console.log(`  Current Balance: ${payment.member.outstandingBalance} ETB`);
      totalAmount += Number(payment.amount);
    }
    
    console.log('\n─────────────────────────────────────────────────');
    console.log(`\nTotal amount to be removed: ${totalAmount} ETB`);
    console.log('\n⚠️  WARNING: This will:');
    console.log('  1. Delete these payment records from the database');
    console.log('  2. Add the payment amounts back to members outstanding balance');
    console.log('  3. Cannot be undone without database backup\n');

    // Ask for confirmation (in a real scenario)
    console.log('Proceeding with deletion in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Process each payment
    let deletedCount = 0;
    let totalRestored = 0;

    for (const payment of otherPayments) {
      const paymentAmount = Number(payment.amount);
      const currentBalance = Number(payment.member.outstandingBalance);
      const newBalance = currentBalance + paymentAmount;

      console.log(`Processing: ${payment.member.fullName}...`);

      // Update member balance (add back the payment amount)
      await prisma.member.update({
        where: { id: payment.memberId },
        data: { 
          outstandingBalance: newBalance
        }
      });

      // Delete the payment record
      await prisma.payment.delete({
        where: { id: payment.id }
      });

      console.log(`  ✅ Deleted payment: ${paymentAmount} ETB`);
      console.log(`  ✅ Balance updated: ${currentBalance} → ${newBalance} ETB`);

      deletedCount++;
      totalRestored += paymentAmount;
    }

    console.log('\n========================================');
    console.log('✅ SUCCESS!');
    console.log('========================================');
    console.log(`Deleted Payments: ${deletedCount}`);
    console.log(`Total Amount Restored to Balances: ${totalRestored} ETB`);
    console.log('\n"Other penalty" payments have been cleared.\n');

    // Show final totals
    const totalPayments = await prisma.payment.count({
      where: { status: 'VERIFIED' }
    });

    const totalBalance = await prisma.member.aggregate({
      _sum: { outstandingBalance: true }
    });

    console.log('📊 FINAL SUMMARY:');
    console.log(`  - Total verified payments: ${totalPayments}`);
    console.log(`  - Total outstanding balance: ${totalBalance._sum.outstandingBalance || 0} ETB`);
    console.log('');

  } catch (error) {
    console.error('❌ Error clearing payments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearOtherPenalties()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
