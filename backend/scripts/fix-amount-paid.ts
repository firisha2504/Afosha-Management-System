import prisma from '../src/config/database.js';

async function main() {
  const obligations = await prisma.weeklyObligation.findMany({
    include: {
      payments: {
        where: { status: { in: ['PENDING', 'VERIFIED'] } },
        select: { amount: true },
      },
    },
  });

  let fixed = 0;
  for (const o of obligations) {
    const correctPaid = o.payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalDue = Number(o.totalDue);
    const capped = Math.min(correctPaid, totalDue);
    const current = Number(o.amountPaid);

    if (current !== capped) {
      let status = o.status;
      if (capped <= 0) status = 'PENDING';
      else if (capped >= totalDue) status = 'PAID';
      else status = 'PARTIAL';

      await prisma.weeklyObligation.update({
        where: { id: o.id },
        data: { amountPaid: capped, status },
      });
      console.log(`Fixed week ${o.weekNumber}/${o.year}: ${current} -> ${capped} ETB`);
      fixed++;
    }
  }

  console.log(`Done. Fixed ${fixed} obligation(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
