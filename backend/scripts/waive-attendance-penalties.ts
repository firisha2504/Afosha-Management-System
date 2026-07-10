import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Waive all penalties with "Absent from meeting" in the reason
 * These were created by the old attendance-based penalty logic
 * New logic: penalties only for non-payment
 */
async function waiveAttendancePenalties() {
  console.log('========================================');
  console.log('Waiving Old Attendance-Based Penalties');
  console.log('========================================\n');

  try {
    // Find all OUTSTANDING penalties that mention "meeting" in the reason
    const attendancePenalties = await prisma.penalty.findMany({
      where: {
        status: 'OUTSTANDING',
        reason: {
          contains: 'meeting',
          mode: 'insensitive', // case-insensitive search
        },
      },
      include: {
        member: {
          select: {
            fullName: true,
            memberId: true,
            outstandingBalance: true,
          },
        },
      },
    });

    console.log(`Found ${attendancePenalties.length} attendance-based penalties to waive\n`);

    if (attendancePenalties.length === 0) {
      console.log('✅ No attendance penalties found. All done!');
      return;
    }

    // Show what we found
    console.log('Penalties to be waived:');
    console.log('─────────────────────────────────────────────────────────────');
    for (const penalty of attendancePenalties) {
      console.log(`  • ${penalty.member.fullName} (${penalty.member.memberId})`);
      console.log(`    Amount: ${penalty.amount} Birr`);
      console.log(`    Reason: ${penalty.reason}`);
      console.log(`    Week: ${penalty.weekNumber}, Year: ${penalty.year}`);
      console.log('');
    }
    console.log('─────────────────────────────────────────────────────────────\n');

    // Calculate total amount being waived
    const totalAmount = attendancePenalties.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    console.log(`Total amount to be waived: ${totalAmount} Birr\n`);

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will waive (forgive) these penalties.');
    console.log('Members will NOT have to pay them.');
    console.log('Their outstanding balances will be reduced.\n');

    // Waive each penalty
    let waivedCount = 0;
    let totalReduced = 0;

    for (const penalty of attendancePenalties) {
      const penaltyAmount = Number(penalty.amount);
      const currentBalance = Number(penalty.member.outstandingBalance);
      const newBalance = Math.max(0, currentBalance - penaltyAmount);

      await prisma.$transaction(async (tx) => {
        // Update penalty status to WAIVED
        await tx.penalty.update({
          where: { id: penalty.id },
          data: { status: 'WAIVED' },
        });

        // Reduce member's outstanding balance
        await tx.member.update({
          where: { id: penalty.memberId },
          data: { outstandingBalance: newBalance },
        });
      });

      console.log(`✅ Waived: ${penalty.member.fullName} - ${penaltyAmount} Birr`);
      waivedCount++;
      totalReduced += penaltyAmount;
    }

    console.log('\n========================================');
    console.log('✅ SUCCESS!');
    console.log('========================================');
    console.log(`Waived Penalties: ${waivedCount}`);
    console.log(`Total Amount Waived: ${totalReduced} Birr`);
    console.log('\nThese penalties are now marked as WAIVED.');
    console.log('Members do not have to pay them.');
    console.log('Their outstanding balances have been reduced.\n');

    console.log('📋 Summary:');
    console.log('  • Old attendance-based penalties: WAIVED ✅');
    console.log('  • New penalty logic: Payment-based only ✅');
    console.log('  • Members get fresh start with new rules ✅\n');

  } catch (error) {
    console.error('❌ Error waiving penalties:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
waiveAttendancePenalties()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
