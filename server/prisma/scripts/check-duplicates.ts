#!/usr/bin/env node
/**
 * Duplicate Check Script for Phase 0I Constraints
 * Run this before applying migration 0003 to verify no duplicates exist.
 * 
 * Usage: npx ts-node prisma/scripts/check-duplicates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCandidateSessionDuplicates() {
  console.log('\n🔍 Checking CandidateSession active session duplicates...');
  
  const duplicates = await prisma.$queryRaw<Array<{
    candidateId: string;
    examId: string;
    count: bigint;
  }>>`
    SELECT "candidateId", "examId", COUNT(*) as count
    FROM "CandidateSession"
    WHERE "status" IN ('ACTIVE', 'IN_PROGRESS', 'STARTED')
    GROUP BY "candidateId", "examId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    console.error('❌ FAIL: CandidateSession active session duplicates found:');
    for (const d of duplicates) {
      console.error(`  candidateId: ${d.candidateId}, examId: ${d.examId}, count: ${d.count}`);
    }
    return false;
  } else {
    console.log('✅ PASS: No CandidateSession active session duplicates');
    return true;
  }
}

async function checkCentreActivationDuplicates() {
  console.log('\n🔍 Checking CentreActivation valid activation duplicates...');
  
  const duplicates = await prisma.$queryRaw<Array<{
    examId: string;
    centreId: string;
    count: bigint;
  }>>`
    SELECT "examId", "centreId", COUNT(*) as count
    FROM "CentreActivation"
    WHERE "isValid" = true
    GROUP BY "examId", "centreId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    console.error('❌ FAIL: CentreActivation valid activation duplicates found:');
    for (const d of duplicates) {
      console.error(`  examId: ${d.examId}, centreId: ${d.centreId}, count: ${d.count}`);
    }
    return false;
  } else {
    console.log('✅ PASS: No CentreActivation valid activation duplicates');
    return true;
  }
}

async function checkCandidateApplicationDuplicates() {
  console.log('\n🔍 Checking CandidateApplication duplicates...');
  
  const duplicates = await prisma.$queryRaw<Array<{
    candidateId: string;
    examCatalogCode: string;
    count: bigint;
  }>>`
    SELECT "candidateId", "examCatalogCode", COUNT(*) as count
    FROM "CandidateApplication"
    GROUP BY "candidateId", "examCatalogCode"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    console.error('❌ FAIL: CandidateApplication duplicates found:');
    for (const d of duplicates) {
      console.error(`  candidateId: ${d.candidateId}, examCatalogCode: ${d.examCatalogCode}, count: ${d.count}`);
    }
    return false;
  } else {
    console.log('✅ PASS: No CandidateApplication duplicates');
    return true;
  }
}

async function main() {
  console.log('🔍 ParikshaTantra Phase 0I - Duplicate Constraint Checks');
  console.log('===========================================================');
  
  const results = await Promise.all([
    checkCandidateSessionDuplicates(),
    checkCentreActivationDuplicates(),
    checkCandidateApplicationDuplicates(),
  ]);
  
  const allPassed = results.every(r => r);
  
  console.log('\n===========================================================');
  if (allPassed) {
    console.log('✅ ALL DUPLICATE CHECKS PASSED - Safe to apply migration 0003');
    process.exit(0);
  } else {
    console.error('❌ DUPLICATE CHECKS FAILED - DO NOT APPLY MIGRATION 0003');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error running duplicate checks:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });