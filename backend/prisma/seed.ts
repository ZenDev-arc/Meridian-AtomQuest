import { PrismaClient, Role, CyclePhase, UomType, GoalStatus, ProgressStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Helper: createIfNotExists via findFirst + create
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>
): Promise<T> {
  const existing = await findFn();
  if (existing) return existing;
  return createFn();
}

async function main() {
  console.log('🌱 Seeding Meridian database...\n');

  // --- Users ---
  const adminPassword = await bcrypt.hash('meridian_admin', 12);
  const managerPassword = await bcrypt.hash('meridian_manager', 12);
  const employeePassword = await bcrypt.hash('meridian_employee', 12);

  const admin = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: 'admin@meridian.co' } }),
    () => prisma.user.create({
      data: {
        name: 'Arjun Mehta',
        email: 'admin@meridian.co',
        passwordHash: adminPassword,
        role: Role.ADMIN,
        department: 'HR',
      },
    })
  );

  const manager = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: 'manager@meridian.co' } }),
    () => prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'manager@meridian.co',
        passwordHash: managerPassword,
        role: Role.MANAGER,
        department: 'Sales',
      },
    })
  );

  const employee = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: 'employee@meridian.co' } }),
    () => prisma.user.create({
      data: {
        name: 'Rohan Verma',
        email: 'employee@meridian.co',
        passwordHash: employeePassword,
        role: Role.EMPLOYEE,
        department: 'Sales',
        managerId: manager.id,
      },
    })
  );

  console.log('✅ Users created:');
  console.log('   Admin:    admin@meridian.co / meridian_admin');
  console.log('   Manager:  manager@meridian.co / meridian_manager');
  console.log('   Employee: employee@meridian.co / meridian_employee\n');

  // --- Active Cycle ---
  const cycle = await findOrCreate(
    () => prisma.cycle.findFirst({ where: { id: 'fy2025-26' } }),
    () => prisma.cycle.create({
      data: {
        id: 'fy2025-26',
        name: 'FY 2025-26',
        phase: CyclePhase.Q2,
        windowOpen: new Date('2025-10-01'),
        windowClose: new Date('2025-12-31'),
        isActive: true,
      },
    })
  );

  console.log('✅ Active cycle created: FY 2025-26 (Q2)\n');

  // --- Goals for employee ---
  const goal1 = await findOrCreate(
    () => prisma.goal.findFirst({ where: { id: 'goal-rohan-1' } }),
    () => prisma.goal.create({
      data: {
        id: 'goal-rohan-1',
        userId: employee.id,
        cycleId: cycle.id,
        thrustArea: 'Revenue Growth',
        title: 'Achieve ₹1.5 Cr in Q2 Sales',
        description: 'Drive revenue targets through enterprise pipeline expansion and deal closures.',
        uomType: UomType.MIN,
        targetValue: 15000000,
        weightage: 35,
        status: GoalStatus.APPROVED,
        lockedAt: new Date('2025-05-15'),
      },
    })
  );

  const goal2 = await findOrCreate(
    () => prisma.goal.findFirst({ where: { id: 'goal-rohan-2' } }),
    () => prisma.goal.create({
      data: {
        id: 'goal-rohan-2',
        userId: employee.id,
        cycleId: cycle.id,
        thrustArea: 'Customer Success',
        title: 'Maintain NPS Score above 70',
        description: 'Ensure customer satisfaction through regular follow-ups and issue resolution.',
        uomType: UomType.MIN,
        targetValue: 70,
        weightage: 25,
        status: GoalStatus.APPROVED,
        lockedAt: new Date('2025-05-15'),
      },
    })
  );

  const goal3 = await findOrCreate(
    () => prisma.goal.findFirst({ where: { id: 'goal-rohan-3' } }),
    () => prisma.goal.create({
      data: {
        id: 'goal-rohan-3',
        userId: employee.id,
        cycleId: cycle.id,
        thrustArea: 'Operational Excellence',
        title: 'Reduce deal closure time by 20%',
        description: 'Streamline sales process to shorten average deal cycle from 45 to 36 days.',
        uomType: UomType.MAX,
        targetValue: 36,
        weightage: 20,
        status: GoalStatus.APPROVED,
        lockedAt: new Date('2025-05-15'),
      },
    })
  );

  const goal4 = await findOrCreate(
    () => prisma.goal.findFirst({ where: { id: 'goal-rohan-4' } }),
    () => prisma.goal.create({
      data: {
        id: 'goal-rohan-4',
        userId: employee.id,
        cycleId: cycle.id,
        thrustArea: 'Learning & Development',
        title: 'Complete Salesforce CRM Certification',
        description: 'Obtain Salesforce Sales Cloud Consultant certification by Q3.',
        uomType: UomType.TIMELINE,
        targetDate: new Date('2026-01-31'),
        weightage: 10,
        status: GoalStatus.APPROVED,
        lockedAt: new Date('2025-05-15'),
      },
    })
  );

  const goal5 = await findOrCreate(
    () => prisma.goal.findFirst({ where: { id: 'goal-rohan-5' } }),
    () => prisma.goal.create({
      data: {
        id: 'goal-rohan-5',
        userId: employee.id,
        cycleId: cycle.id,
        thrustArea: 'Compliance',
        title: 'Zero policy violations in FY',
        description: 'Ensure full compliance with all internal sales policies and regulatory guidelines.',
        uomType: UomType.ZERO,
        targetValue: 0,
        weightage: 10,
        status: GoalStatus.APPROVED,
        lockedAt: new Date('2025-05-15'),
      },
    })
  );

  console.log('✅ Goals created for Rohan Verma (5 goals, 100% weightage)\n');

  // --- Q1 Check-ins ---
  await findOrCreate(
    () => prisma.checkIn.findFirst({ where: { id: 'checkin-rohan-g1-q1' } }),
    () => prisma.checkIn.create({
      data: {
        id: 'checkin-rohan-g1-q1',
        goalId: goal1.id,
        cyclePhase: CyclePhase.Q1,
        actualValue: 9800000,
        progressStatus: ProgressStatus.ON_TRACK,
        computedScore: 65.3,
        managerComment: 'Strong start, pipeline looks healthy. Keep the momentum.',
      },
    })
  );

  await findOrCreate(
    () => prisma.checkIn.findFirst({ where: { id: 'checkin-rohan-g2-q1' } }),
    () => prisma.checkIn.create({
      data: {
        id: 'checkin-rohan-g2-q1',
        goalId: goal2.id,
        cyclePhase: CyclePhase.Q1,
        actualValue: 74,
        progressStatus: ProgressStatus.ON_TRACK,
        computedScore: 100,
        managerComment: 'Excellent customer feedback scores this quarter.',
      },
    })
  );

  await findOrCreate(
    () => prisma.checkIn.findFirst({ where: { id: 'checkin-rohan-g3-q1' } }),
    () => prisma.checkIn.create({
      data: {
        id: 'checkin-rohan-g3-q1',
        goalId: goal3.id,
        cyclePhase: CyclePhase.Q1,
        actualValue: 41,
        progressStatus: ProgressStatus.ON_TRACK,
        computedScore: 87.8,
        managerComment: 'Progress noted. Still room to improve on deal velocity.',
      },
    })
  );

  await findOrCreate(
    () => prisma.checkIn.findFirst({ where: { id: 'checkin-rohan-g5-q1' } }),
    () => prisma.checkIn.create({
      data: {
        id: 'checkin-rohan-g5-q1',
        goalId: goal5.id,
        cyclePhase: CyclePhase.Q1,
        actualValue: 0,
        progressStatus: ProgressStatus.COMPLETED,
        computedScore: 100,
        managerComment: 'Zero violations. Excellent compliance record.',
      },
    })
  );

  console.log('✅ Q1 check-ins seeded\n');

  // --- Q2 Check-in (in progress) ---
  await findOrCreate(
    () => prisma.checkIn.findFirst({ where: { id: 'checkin-rohan-g1-q2' } }),
    () => prisma.checkIn.create({
      data: {
        id: 'checkin-rohan-g1-q2',
        goalId: goal1.id,
        cyclePhase: CyclePhase.Q2,
        actualValue: 11200000,
        progressStatus: ProgressStatus.ON_TRACK,
        computedScore: 74.7,
      },
    })
  );

  console.log('✅ Q2 check-in seeded (in progress)\n');

  // --- Approval record ---
  await findOrCreate(
    () => prisma.approval.findFirst({ where: { id: 'approval-rohan-fy2526' } }),
    () => prisma.approval.create({
      data: {
        id: 'approval-rohan-fy2526',
        goalSheetUserId: employee.id,
        managerId: manager.id,
        action: 'APPROVED',
        comment: 'Goals are well-defined and aligned with department targets. Approved.',
        cycleId: cycle.id,
      },
    })
  );

  console.log('✅ Approval record created\n');

  // Suppress unused variable warnings
  void goal4;

  console.log('🎉 Seed complete! Meridian is ready.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Login credentials for demo:');
  console.log('  Admin:    admin@meridian.co    / meridian_admin');
  console.log('  Manager:  manager@meridian.co  / meridian_manager');
  console.log('  Employee: employee@meridian.co / meridian_employee');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
