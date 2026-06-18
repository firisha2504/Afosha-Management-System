import { applyMissingPenaltiesToExistingObligations } from '../src/services/contribution.service.js';
import prisma from '../src/config/database.js';

applyMissingPenaltiesToExistingObligations()
  .then((fixed) => console.log(`Applied penalties to ${fixed} obligation(s).`))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
