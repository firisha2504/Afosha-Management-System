import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteFiromsaPenalty() {
  console.log('🗑️  Deleting Firomsa Abdi penalty (should not exist)...\n');

  // Find Firomsa Abdi
  const firomsa = await prisma.member.findFirst({
    where: {
      fullName: {
        contains: 'Firomsa',
        mode: 'insensitive',
      },
    },
  });

  if (!firomsa) {
    console.log('❌ Firomsa Abdi not found');
    return;
  }

  console.log(`✅ Found member: ${firomsa.fullName} (${firomsa.memberId})`);
  console.log(`   Current Outstanding Balance: ${firomsa.outstandingBalance} ETB\n`);

  // Find all his penalties
  const penalties = await prisma.penalty.findMany({
    where: { memberId: firomsa.id },
  });

  if (penalties.length === 0) {
    console.log('✅ No penalties found for Firomsa. Already clean!');
    return;
  }

  console.log(`📋 Found ${penalties.length} penalty(ies) to delete:\n`);

  for (const penalty of penalties) {
    console.log(`   Penalty ID: ${penalty.id}`);
    console.log(`   Week: ${penalty.weekNumber}, Year: ${penalty.year}`);
    console.log(`   Amount: ${penalty.amount} ETB`);
    console.log(`   Reason: ${penalty.reason}`);
    console.log(`   Status: ${penalty.status}`);
    console.log('   ---');
  }

  // Calculate total penalty amount to remove from outstanding balance
  const totalPenaltyAmount = penalties.reduce((sum, p) => sum + Number(p.amount), 0);

  console.log(`\n💰 Total penalty amount to remove: ${totalPenaltyAmount} ETB`);

  // Delete all penalties and adjust balance
  await prisma.$transaction(async (tx) => {
    // Delete all penalties
    await tx.penalty.deleteMany({
      where: { memberId: firomsa.id },
    });

    // Restore member's outstanding balance (remove penalty amounts)
    if (totalPenaltyAmount > 0 && firomsa.outstandingBalance >= totalPenaltyAmount) {
      await tx.member.update({
        where: { id: firomsa.id },
        data: {
          outstandingBalance: {
            decrement: totalPenaltyAmount,
          },
        },
      });
    } else {
      // Set to 0 if current balance is less than penalty amount
      await tx.member.update({
        where: { id: firomsa.id },
        data: {
          outstandingBalance: 0,
        },
      });
    }
  });

  console.log(`\n✅ DELETED!`);
  console.log(`   Penalties removed: ${penalties.length}`);
  console.log(`   Total amount: ${totalPenaltyAmount} ETB`);

  // Verify the deletion
  const updatedMember = await prisma.member.findUnique({
    where: { id: firomsa.id },
  });

  const remainingPenalties = await prisma.penalty.count({
    where: { memberId: firomsa.id },
  });

  console.log(`\n📊 Updated member data:`);
  console.log(`   ${updatedMember!.fullName} (${updatedMember!.memberId})`);
  console.log(`   Outstanding Balance: ${updatedMember!.outstandingBalance} ETB`);
  console.log(`   Remaining Penalties: ${remainingPenalties}`);

  if (remainingPenalties === 0 && updatedMember!.outstandingBalance === 0) {
    console.log(`\n✅ Perfect! Firomsa has no penalties and 0 balance. All clean!`);
  }

  await prisma.$disconnect();
}

deleteFiromsaPenalty().catch(console.error);
