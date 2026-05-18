import prisma from '../utils/prisma';
import { CyclePhase, GoalStatus, ProgressStatus } from '@prisma/client';

export async function getCycles() {
  return prisma.cycle.findMany({
    orderBy: { windowOpen: 'desc' },
  });
}

export async function updateCycle(
  cycleId: string,
  data: {
    phase?: CyclePhase;
    windowOpen?: string;
    windowClose?: string;
    isActive?: boolean;
    name?: string;
  }
) {
  // If activating this cycle, deactivate all other cycles first
  if (data.isActive === true) {
    await prisma.cycle.updateMany({
      where: { id: { not: cycleId } },
      data: { isActive: false },
    });
  }

  return prisma.cycle.update({
    where: { id: cycleId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.phase && { phase: data.phase }),
      ...(data.windowOpen && { windowOpen: new Date(data.windowOpen) }),
      ...(data.windowClose && { windowClose: new Date(data.windowClose) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function createCycle(data: {
  name: string;
  phase: CyclePhase;
  windowOpen: string;
  windowClose: string;
  isActive?: boolean;
}) {
  if (data.isActive === true) {
    await prisma.cycle.updateMany({
      data: { isActive: false },
    });
  }

  return prisma.cycle.create({
    data: {
      name: data.name,
      phase: data.phase,
      windowOpen: new Date(data.windowOpen),
      windowClose: new Date(data.windowClose),
      isActive: data.isActive ?? false,
    },
  });
}

export async function getAdminAnalytics() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      department: true,
    },
  });

  const totalEmployees = users.filter((u) => u.role === 'EMPLOYEE').length;
  const totalManagers = users.filter((u) => u.role === 'MANAGER').length;

  const goals = await prisma.goal.findMany({
    include: {
      checkIns: {
        orderBy: { checkedInAt: 'desc' },
        take: 1,
      },
    },
  });

  // Sheet submission counts
  // A "sheet" belongs to a user. Let's find unique users with goals and check status.
  const userGoalsMap: Record<string, typeof goals> = {};
  goals.forEach((g) => {
    if (!userGoalsMap[g.userId]) {
      userGoalsMap[g.userId] = [];
    }
    userGoalsMap[g.userId].push(g);
  });

  let draftSheets = 0;
  let submittedSheets = 0;
  let approvedSheets = 0;
  let returnedSheets = 0;

  Object.values(userGoalsMap).forEach((userGoals) => {
    const isApproved = userGoals.every((g) => g.status === GoalStatus.APPROVED);
    const isSubmitted = userGoals.some((g) => g.status === GoalStatus.SUBMITTED);
    const isReturned = userGoals.some((g) => g.status === GoalStatus.RETURNED);

    if (isApproved) approvedSheets++;
    else if (isSubmitted) submittedSheets++;
    else if (isReturned) returnedSheets++;
    else draftSheets++;
  });

  // Goal progress status aggregates
  let notStartedGoals = 0;
  let onTrackGoals = 0;
  let completedGoals = 0;

  goals.forEach((g) => {
    const latestCheckIn = g.checkIns[0];
    const status = latestCheckIn?.progressStatus ?? ProgressStatus.NOT_STARTED;
    if (status === ProgressStatus.ON_TRACK) onTrackGoals++;
    else if (status === ProgressStatus.COMPLETED) completedGoals++;
    else notStartedGoals++;
  });

  // Departmental statistics
  const deptStats: Record<
    string,
    {
      department: string;
      totalEmployees: number;
      totalGoals: number;
      submittedSheets: number;
      approvedSheets: number;
      averageProgressScore: number;
    }
  > = {};

  users.forEach((u) => {
    if (u.role !== 'EMPLOYEE') return;
    const dept = u.department || 'Sales North';
    if (!deptStats[dept]) {
      deptStats[dept] = {
        department: dept,
        totalEmployees: 0,
        totalGoals: 0,
        submittedSheets: 0,
        approvedSheets: 0,
        averageProgressScore: 0,
      };
    }
    deptStats[dept].totalEmployees++;

    const userGoals = userGoalsMap[u.id] || [];
    deptStats[dept].totalGoals += userGoals.length;

    const isApproved = userGoals.length > 0 && userGoals.every((g) => g.status === GoalStatus.APPROVED);
    const isSubmitted = userGoals.some((g) => g.status === GoalStatus.SUBMITTED);
    if (isApproved) deptStats[dept].approvedSheets++;
    else if (isSubmitted) deptStats[dept].submittedSheets++;

    // Compute average score for this user's goals
    let totalScore = 0;
    userGoals.forEach((g) => {
      totalScore += g.checkIns[0]?.computedScore ?? 0;
    });
    const avgScore = userGoals.length > 0 ? totalScore / userGoals.length : 0;
    deptStats[dept].averageProgressScore += avgScore;
  });

  // Normalize departmental averages
  const departments = Object.values(deptStats).map((dept) => {
    if (dept.totalEmployees > 0) {
      dept.averageProgressScore = Math.round(dept.averageProgressScore / dept.totalEmployees);
    }
    return dept;
  });

  return {
    totalEmployees,
    totalManagers,
    sheets: {
      draft: draftSheets,
      submitted: submittedSheets,
      approved: approvedSheets,
      returned: returnedSheets,
    },
    goals: {
      notStarted: notStartedGoals,
      onTrack: onTrackGoals,
      completed: completedGoals,
      total: goals.length,
    },
    departments,
  };
}
