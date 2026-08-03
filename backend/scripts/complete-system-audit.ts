import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Issue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  member: string;
  description: string;
  currentValue: any;
  expectedValue: any;
  autoFix: boolean;
}

const issues: Issue[] = [];
const fixes: string[] = [];

async function completeSystemAudit() {
  console.log('════════════════════════════════════════════════════════');
  console.log('     COMPLETE SYSTEM AUDIT - DATABASE HEALTH CHECK');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Get all members
    const members = await prisma.member.findMany({
      where: { status: 'APPROVED' },
      orderBy: { fullName: 'asc' }
    });

    console.log(`Found ${members.length} approved members\n`);
    console.log('Starting comprehensive audit...\n');

    // AUDIT 1: Outstanding Balance Verification
    await auditOutstandingBalances(members);

    // AUDIT 2: Weekly Obligations Consistency
    await auditWeeklyObligations(members);

    // AUDIT 3: Penalty Records
    await auditPenalties(members);

    // AUDIT 4: Payment Records
    await auditPayments();

    // AUDIT 5: Orphaned Records
    await auditOrphanedRecords();

    // AUDIT 6: Data Integrity
    await auditDataIntegrity(members);

    // Print Results
    printAuditResults();

    // Ask to fix issues
    if (issues.filter(i => i.autoFix).length > 0) {
      console.log('\n════════════════════════════════════════════════════════');
      console.log('               APPLYING AUTO-FIXES');
      console.log('════════════════════════════════════════════════════════\n');
      
      await applyFixes(members);
      
      console.log('\n✅ All auto-fixes applied successfully!\n');
      
      // Re-run audit to verify
      console.log('Re-running audit to verify fixes...\n');
      issues.length = 0;
      fixes.length = 0;
      
      await auditOutstandingBalances(members);
      await auditWeeklyObligations(members);
      await auditPenalties(members);
      
      printAuditResults();
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 1: Outstanding Balance Verification
// ═══════════════════════════════════════════════════════════════
async function auditOutstandingBalances(members: any[]) {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 1: Outstanding Balance Verification        │');
  console.log('└────────────────────────────────────────────────────┘\n');

  for (const member of members) {
    // Calculate correct outstanding balance
    const obligations = await prisma.weeklyObligation.findMany({
      where: { memberId: member.id }
    });

    const calculatedOutstanding = obligations.reduce((sum, obl) => {
      return sum + (Number(obl.totalDue) - Number(obl.amountPaid));
    }, 0);

    const databaseOutstanding = Number(member.outstandingBalance);

    if (calculatedOutstanding !== databaseOutstanding) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Outstanding Balance',
        member: `${member.fullName} (${member.memberId})`,
        description: 'Outstanding balance mismatch',
        currentValue: `${databaseOutstanding} ETB`,
        expectedValue: `${calculatedOutstanding} ETB`,
        autoFix: true
      });
    }
  }

  console.log(`✓ Checked ${members.length} members\n`);
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 2: Weekly Obligations Consistency
// ═══════════════════════════════════════════════════════════════
async function auditWeeklyObligations(members: any[]) {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 2: Weekly Obligations Consistency          │');
  console.log('└────────────────────────────────────────────────────┘\n');

  for (const member of members) {
    const obligations = await prisma.weeklyObligation.findMany({
      where: { memberId: member.id }
    });

    for (const obl of obligations) {
      // Check 1: totalDue = contributionAmount + penaltyAmount
      const expectedTotalDue = Number(obl.contributionAmount) + Number(obl.penaltyAmount);
      const actualTotalDue = Number(obl.totalDue);

      if (expectedTotalDue !== actualTotalDue) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Obligation TotalDue',
          member: `${member.fullName} (Week ${obl.weekNumber}/${obl.year})`,
          description: 'totalDue != contributionAmount + penaltyAmount',
          currentValue: `${actualTotalDue} ETB`,
          expectedValue: `${expectedTotalDue} ETB`,
          autoFix: true
        });
      }

      // Check 2: Status matches payment
      const paidAmount = Number(obl.amountPaid);
      const totalDue = Number(obl.totalDue);
      let expectedStatus = 'PENDING';

      if (paidAmount >= totalDue) {
        expectedStatus = 'PAID';
      } else if (paidAmount > 0) {
        expectedStatus = 'PARTIAL';
      } else if (new Date() > new Date(obl.dueDate)) {
        expectedStatus = 'OVERDUE';
      }

      if (obl.status !== expectedStatus && !(obl.status === 'PENDING' && expectedStatus === 'OVERDUE')) {
        issues.push({
          severity: 'WARNING',
          category: 'Obligation Status',
          member: `${member.fullName} (Week ${obl.weekNumber}/${obl.year})`,
          description: 'Status does not match payment amount',
          currentValue: obl.status,
          expectedValue: expectedStatus,
          autoFix: true
        });
      }

      // Check 3: Negative values
      if (paidAmount < 0 || totalDue < 0 || Number(obl.penaltyAmount) < 0) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Negative Values',
          member: `${member.fullName} (Week ${obl.weekNumber}/${obl.year})`,
          description: 'Negative amount detected',
          currentValue: `Paid: ${paidAmount}, Due: ${totalDue}, Penalty: ${obl.penaltyAmount}`,
          expectedValue: 'All values should be >= 0',
          autoFix: false
        });
      }

      // Check 4: Overpayment
      if (paidAmount > totalDue) {
        issues.push({
          severity: 'WARNING',
          category: 'Overpayment',
          member: `${member.fullName} (Week ${obl.weekNumber}/${obl.year})`,
          description: 'Amount paid exceeds total due',
          currentValue: `Paid: ${paidAmount} ETB, Due: ${totalDue} ETB`,
          expectedValue: `Paid should be <= ${totalDue} ETB`,
          autoFix: false
        });
      }
    }
  }

  console.log(`✓ Checked weekly obligations\n`);
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 3: Penalty Records
// ═══════════════════════════════════════════════════════════════
async function auditPenalties(members: any[]) {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 3: Penalty Records                          │');
  console.log('└────────────────────────────────────────────────────┘\n');

  for (const member of members) {
    const penalties = await prisma.penalty.findMany({
      where: { memberId: member.id }
    });

    for (const penalty of penalties) {
      // Check 1: Penalty has week number but no obligation exists
      if (penalty.weekNumber && penalty.year) {
        const obligation = await prisma.weeklyObligation.findFirst({
          where: {
            memberId: member.id,
            weekNumber: penalty.weekNumber,
            year: penalty.year
          }
        });

        if (!obligation) {
          issues.push({
            severity: 'WARNING',
            category: 'Orphaned Penalty',
            member: `${member.fullName}`,
            description: `Penalty for Week ${penalty.weekNumber}/${penalty.year} has no obligation`,
            currentValue: `${penalty.amount} ETB (${penalty.status})`,
            expectedValue: 'Should have matching obligation',
            autoFix: false
          });
        } else {
          // Check if penalty amount matches obligation's penalty
          if (penalty.status === 'OUTSTANDING' && Number(obligation.penaltyAmount) === 0) {
            issues.push({
              severity: 'WARNING',
              category: 'Penalty Mismatch',
              member: `${member.fullName} (Week ${penalty.weekNumber}/${penalty.year})`,
              description: 'Penalty marked OUTSTANDING but obligation has 0 penalty',
              currentValue: `Penalty: ${penalty.amount} ETB, Obligation penalty: ${obligation.penaltyAmount} ETB`,
              expectedValue: 'Should match',
              autoFix: false
            });
          }
        }
      }

      // Check 2: SETTLED penalty should have paidAt date
      if (penalty.status === 'SETTLED' && !penalty.paidAt) {
        issues.push({
          severity: 'WARNING',
          category: 'Penalty Date',
          member: `${member.fullName}`,
          description: 'SETTLED penalty missing paidAt date',
          currentValue: 'NULL',
          expectedValue: 'Should have date',
          autoFix: false
        });
      }

      // Check 3: OUTSTANDING penalty with paidAt date
      if (penalty.status === 'OUTSTANDING' && penalty.paidAt) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Penalty Status',
          member: `${member.fullName}`,
          description: 'OUTSTANDING penalty has paidAt date',
          currentValue: `OUTSTANDING (paid: ${penalty.paidAt})`,
          expectedValue: 'Should be SETTLED',
          autoFix: true
        });
      }
    }
  }

  console.log(`✓ Checked penalty records\n`);
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 4: Payment Records
// ═══════════════════════════════════════════════════════════════
async function auditPayments() {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 4: Payment Records                          │');
  console.log('└────────────────────────────────────────────────────┘\n');

  const payments = await prisma.payment.findMany({
    include: {
      member: { select: { fullName: true, memberId: true } },
      obligation: true
    }
  });

  for (const payment of payments) {
    // Check 1: Payment linked to obligation but obligation doesn't exist
    if (payment.obligationId && !payment.obligation) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Broken Link',
        member: `${payment.member.fullName}`,
        description: 'Payment links to non-existent obligation',
        currentValue: payment.obligationId,
        expectedValue: 'Should link to valid obligation or be NULL',
        autoFix: false
      });
    }

    // Check 2: Negative payment amount
    if (Number(payment.amount) < 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Negative Payment',
        member: `${payment.member.fullName}`,
        description: 'Payment has negative amount',
        currentValue: `${payment.amount} ETB`,
        expectedValue: 'Should be positive',
        autoFix: false
      });
    }

    // Check 3: VERIFIED payment without verifiedAt date
    if (payment.status === 'VERIFIED' && !payment.verifiedAt) {
      issues.push({
        severity: 'WARNING',
        category: 'Payment Date',
        member: `${payment.member.fullName}`,
        description: 'VERIFIED payment missing verifiedAt date',
        currentValue: 'NULL',
        expectedValue: 'Should have date',
        autoFix: false
      });
    }

    // Check 4: "Other payments" (not linked to any obligation)
    if (!payment.obligationId && !payment.specialContributionObligationId) {
      issues.push({
        severity: 'INFO',
        category: 'Other Payment',
        member: `${payment.member.fullName}`,
        description: 'Payment not linked to any obligation',
        currentValue: `${payment.amount} ETB - ${payment.notes || 'No notes'}`,
        expectedValue: 'Should be linked to obligation',
        autoFix: false
      });
    }
  }

  console.log(`✓ Checked ${payments.length} payments\n`);
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 5: Orphaned Records
// ═══════════════════════════════════════════════════════════════
async function auditOrphanedRecords() {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 5: Orphaned Records                         │');
  console.log('└────────────────────────────────────────────────────┘\n');

  // Check for obligations without valid members
  const allObligations = await prisma.weeklyObligation.findMany({
    include: { member: true }
  });

  const orphanedObligations = allObligations.filter(o => !o.member);

  if (orphanedObligations.length > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Orphaned Records',
      member: 'N/A',
      description: `${orphanedObligations.length} obligations without members`,
      currentValue: 'Orphaned',
      expectedValue: 'Should have member',
      autoFix: false
    });
  }

  // Check for penalties without valid members
  const allPenalties = await prisma.penalty.findMany({
    include: { member: true }
  });

  const orphanedPenalties = allPenalties.filter(p => !p.member);

  if (orphanedPenalties.length > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Orphaned Records',
      member: 'N/A',
      description: `${orphanedPenalties.length} penalties without members`,
      currentValue: 'Orphaned',
      expectedValue: 'Should have member',
      autoFix: false
    });
  }

  console.log(`✓ Checked for orphaned records\n`);
}

// ═══════════════════════════════════════════════════════════════
// AUDIT 6: Data Integrity
// ═══════════════════════════════════════════════════════════════
async function auditDataIntegrity(members: any[]) {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  AUDIT 6: Data Integrity                           │');
  console.log('└────────────────────────────────────────────────────┘\n');

  for (const member of members) {
    // Check totalCredit is consistent
    const totalPaid = await prisma.payment.aggregate({
      where: {
        memberId: member.id,
        status: 'VERIFIED'
      },
      _sum: { amount: true }
    });

    const calculatedTotalCredit = Number(totalPaid._sum.amount || 0);
    const databaseTotalCredit = Number(member.totalCredit);

    if (Math.abs(calculatedTotalCredit - databaseTotalCredit) > 0.01) {
      issues.push({
        severity: 'WARNING',
        category: 'Total Credit',
        member: `${member.fullName} (${member.memberId})`,
        description: 'totalCredit does not match sum of verified payments',
        currentValue: `${databaseTotalCredit} ETB`,
        expectedValue: `${calculatedTotalCredit} ETB`,
        autoFix: true
      });
    }
  }

  console.log(`✓ Checked data integrity\n`);
}

// ═══════════════════════════════════════════════════════════════
// APPLY FIXES
// ═══════════════════════════════════════════════════════════════
async function applyFixes(members: any[]) {
  const fixableIssues = issues.filter(i => i.autoFix);
  
  console.log(`Applying ${fixableIssues.length} auto-fixes...\n`);

  for (const member of members) {
    // FIX 1: Outstanding Balance
    const balanceIssue = fixableIssues.find(
      i => i.category === 'Outstanding Balance' && i.member.includes(member.memberId)
    );

    if (balanceIssue) {
      const obligations = await prisma.weeklyObligation.findMany({
        where: { memberId: member.id }
      });

      const correctBalance = obligations.reduce((sum, obl) => {
        return sum + (Number(obl.totalDue) - Number(obl.amountPaid));
      }, 0);

      await prisma.member.update({
        where: { id: member.id },
        data: { outstandingBalance: correctBalance }
      });

      fixes.push(`✓ Fixed outstanding balance for ${member.fullName}: ${balanceIssue.currentValue} → ${balanceIssue.expectedValue}`);
    }

    // FIX 2: Total Credit
    const creditIssue = fixableIssues.find(
      i => i.category === 'Total Credit' && i.member.includes(member.memberId)
    );

    if (creditIssue) {
      const totalPaid = await prisma.payment.aggregate({
        where: {
          memberId: member.id,
          status: 'VERIFIED'
        },
        _sum: { amount: true }
      });

      const correctCredit = Number(totalPaid._sum.amount || 0);

      await prisma.member.update({
        where: { id: member.id },
        data: { totalCredit: correctCredit }
      });

      fixes.push(`✓ Fixed total credit for ${member.fullName}: ${creditIssue.currentValue} → ${creditIssue.expectedValue}`);
    }

    // FIX 3: Obligation totalDue
    const obligations = await prisma.weeklyObligation.findMany({
      where: { memberId: member.id }
    });

    for (const obl of obligations) {
      const totalDueIssue = fixableIssues.find(
        i => i.category === 'Obligation TotalDue' && 
             i.member.includes(member.memberId) &&
             i.member.includes(`Week ${obl.weekNumber}/${obl.year}`)
      );

      if (totalDueIssue) {
        const correctTotalDue = Number(obl.contributionAmount) + Number(obl.penaltyAmount);

        await prisma.weeklyObligation.update({
          where: { id: obl.id },
          data: { totalDue: correctTotalDue }
        });

        fixes.push(`✓ Fixed totalDue for ${member.fullName} Week ${obl.weekNumber}/${obl.year}: ${totalDueIssue.currentValue} → ${totalDueIssue.expectedValue}`);
      }

      // FIX 4: Obligation status
      const statusIssue = fixableIssues.find(
        i => i.category === 'Obligation Status' && 
             i.member.includes(member.memberId) &&
             i.member.includes(`Week ${obl.weekNumber}/${obl.year}`)
      );

      if (statusIssue) {
        await prisma.weeklyObligation.update({
          where: { id: obl.id },
          data: { status: statusIssue.expectedValue as any }
        });

        fixes.push(`✓ Fixed status for ${member.fullName} Week ${obl.weekNumber}/${obl.year}: ${statusIssue.currentValue} → ${statusIssue.expectedValue}`);
      }
    }

    // FIX 5: Penalty status
    const penalties = await prisma.penalty.findMany({
      where: { memberId: member.id }
    });

    for (const penalty of penalties) {
      const penaltyIssue = fixableIssues.find(
        i => i.category === 'Penalty Status' && i.member.includes(member.memberId)
      );

      if (penaltyIssue && penalty.status === 'OUTSTANDING' && penalty.paidAt) {
        await prisma.penalty.update({
          where: { id: penalty.id },
          data: { status: 'SETTLED' }
        });

        fixes.push(`✓ Fixed penalty status for ${member.fullName}: OUTSTANDING → SETTLED`);
      }
    }
  }

  console.log(`\n${fixes.length} fixes applied successfully!\n`);
  fixes.forEach(fix => console.log(fix));
}

// ═══════════════════════════════════════════════════════════════
// PRINT RESULTS
// ═══════════════════════════════════════════════════════════════
function printAuditResults() {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('                  AUDIT RESULTS');
  console.log('════════════════════════════════════════════════════════\n');

  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const warnings = issues.filter(i => i.severity === 'WARNING');
  const info = issues.filter(i => i.severity === 'INFO');

  console.log(`Total Issues Found: ${issues.length}`);
  console.log(`  🔴 Critical: ${critical.length}`);
  console.log(`  🟡 Warnings: ${warnings.length}`);
  console.log(`  🔵 Info: ${info.length}`);
  console.log(`  🔧 Auto-fixable: ${issues.filter(i => i.autoFix).length}\n`);

  if (issues.length === 0) {
    console.log('✅ ✅ ✅  NO ISSUES FOUND! DATABASE IS HEALTHY!  ✅ ✅ ✅\n');
    return;
  }

  // Print Critical Issues
  if (critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES:\n');
    console.log('─'.repeat(80));
    critical.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.member}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Issue: ${issue.description}`);
      console.log(`   Current: ${issue.currentValue}`);
      console.log(`   Expected: ${issue.expectedValue}`);
      console.log(`   Auto-fix: ${issue.autoFix ? '✓ YES' : '✗ NO (manual fix needed)'}`);
      console.log('');
    });
  }

  // Print Warnings
  if (warnings.length > 0) {
    console.log('🟡 WARNINGS:\n');
    console.log('─'.repeat(80));
    warnings.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.member}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Issue: ${issue.description}`);
      console.log(`   Current: ${issue.currentValue}`);
      console.log(`   Expected: ${issue.expectedValue}`);
      console.log(`   Auto-fix: ${issue.autoFix ? '✓ YES' : '✗ NO (manual review needed)'}`);
      console.log('');
    });
  }

  // Print Info
  if (info.length > 0) {
    console.log('🔵 INFO (for your awareness):\n');
    console.log('─'.repeat(80));
    info.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.member}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Issue: ${issue.description}`);
      console.log(`   Details: ${issue.currentValue}`);
      console.log('');
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// RUN AUDIT
// ═══════════════════════════════════════════════════════════════
completeSystemAudit();
