import prisma from '../src/config/database.js';

async function main() {
  const obs = await prisma.weeklyObligation.findMany({
    where: { weekNumber: 26, year: 2026 },
    include: { member: { select: { fullName: true, memberId: true } } },
    orderBy: { member: { fullName: 'asc' } },
  });

  for (const o of obs) {
    console.log(
      o.member.fullName,
      '| penalty:', Number(o.penaltyAmount),
      '| totalDue:', Number(o.totalDue),
      '| missed weeks:', o.consecutiveMissedWeeks
    );
  }

  const penalties = await prisma.penalty.findMany({
    where: { weekNumber: 26, year: 2026 },
    include: { member: { select: { fullName: true } } },
  });
  console.log('Penalty records:', penalties.map((p) => `${p.member.fullName}: ${Number(p.amount)} ETB`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
