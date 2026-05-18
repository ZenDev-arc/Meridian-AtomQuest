import prisma from '../utils/prisma';
import { GoalStatus, UomType, CyclePhase } from '@prisma/client';

// BRD Constants
const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;
const TOTAL_WEIGHTAGE = 100;

export type CreateGoalInput = {
  thrustArea: string;
  title: string;
  description?: string;
  uomType: UomType;
  targetValue?: number;
  targetDate?: string;
  weightage: number;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

// Compute progress score based on UoM type
export function computeScore(
  uomType: UomType,
  targetValue: number | null,
  targetDate: Date | null,
  actualValue: number | null,
  actualDate: Date | null
): number {
  if (uomType === UomType.MIN) {
    if (!targetValue || !actualValue) return 0;
    return Math.min((actualValue / targetValue) * 100, 100);
  }
  if (uomType === UomType.MAX) {
    if (!targetValue || !actualValue || actualValue === 0) return 0;
    return Math.min((targetValue / actualValue) * 100, 100);
  }
  if (uomType === UomType.TIMELINE) {
    if (!targetDate || !actualDate) return 0;
    const onTime = actualDate <= targetDate;
    return onTime ? 100 : 0;
  }
  if (uomType === UomType.ZERO) {
    return actualValue === 0 ? 100 : 0;
  }
  return 0;
}

// Validate BRD rules against a set of goals
export function validateGoalSheet(
  goals: { weightage: number }[],
  options: { skipTotalCheck?: boolean } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (goals.length > MAX_GOALS) {
    errors.push(`Maximum ${MAX_GOALS} goals allowed per cycle.`);
  }

  const underMin = goals.filter((g) => g.weightage < MIN_WEIGHTAGE);
  if (underMin.length > 0) {
    errors.push(`Each goal must have at least ${MIN_WEIGHTAGE}% weightage.`);
  }

  if (!options.skipTotalCheck) {
    const total = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.round(total) !== TOTAL_WEIGHTAGE) {
      errors.push(`Total weightage must equal 100%. Current: ${total.toFixed(1)}%.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function getActiveCycle() {
  return prisma.cycle.findFirst({ where: { isActive: true } });
}

export async function getUserGoals(userId: string, cycleId?: string) {
  const cycle = cycleId ? { id: cycleId } : await getActiveCycle();
  if (!cycle) return [];

  return prisma.goal.findMany({
    where: { userId, cycleId: cycle.id },
    include: {
      checkIns: { orderBy: { checkedInAt: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const cycle = await getActiveCycle();
  if (!cycle) throw new Error('No active cycle found.');
  if (cycle.phase !== 'GOAL_SETTING') throw new Error('Goal setting window is not open.');

  // Get existing goals for validation
  const existing = await prisma.goal.findMany({
    where: { userId, cycleId: cycle.id },
  });

  const draftGoals = existing.filter((g) => g.status !== GoalStatus.APPROVED);
  const allGoals = [...existing.map((g) => ({ weightage: g.weightage })), { weightage: input.weightage }];

  const { valid, errors } = validateGoalSheet(allGoals, { skipTotalCheck: true });
  if (!valid) throw new Error(errors.join(' '));
  if (allGoals.length > MAX_GOALS) throw new Error(`Maximum ${MAX_GOALS} goals allowed.`);

  return prisma.goal.create({
    data: {
      userId,
      cycleId: cycle.id,
      thrustArea: input.thrustArea,
      title: input.title,
      description: input.description,
      uomType: input.uomType,
      targetValue: input.targetValue,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      weightage: input.weightage,
      status: GoalStatus.DRAFT,
    },
  });
}

export async function updateGoal(goalId: string, userId: string, input: UpdateGoalInput) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });
  if (!goal) throw new Error('Goal not found.');

  const isOwner = goal.userId === userId;
  const isManager = goal.user.managerId === userId;

  if (!isOwner && !isManager) {
    throw new Error('Not authorized to edit this goal.');
  }

  if (isOwner && goal.status === GoalStatus.APPROVED) {
    throw new Error('Approved goals cannot be edited.');
  }

  // Recipients of shared goals can only edit weightage (title/targets are read-only)
  if (goal.parentGoalId && isOwner) {
    if (input.thrustArea || input.title || input.description || input.uomType || input.targetValue !== undefined || input.targetDate) {
      throw new Error('Shared departmental KPIs pushed by your manager are read-only. You may adjust weightage only.');
    }
  }

  const updatedGoal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(input.thrustArea && { thrustArea: input.thrustArea }),
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.uomType && { uomType: input.uomType }),
      ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
      ...(input.targetDate && { targetDate: new Date(input.targetDate) }),
      ...(input.weightage !== undefined && { weightage: input.weightage }),
    },
  });

  // propagate title, target, etc. updates down to all linked shared goal copies if this is a primary shared goal
  if (goal.isShared && (input.thrustArea || input.title || input.description || input.uomType || input.targetValue !== undefined || input.targetDate)) {
    await prisma.goal.updateMany({
      where: { parentGoalId: goalId },
      data: {
        ...(input.thrustArea && { thrustArea: input.thrustArea }),
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.uomType && { uomType: input.uomType }),
        ...(input.targetValue !== undefined && { targetValue: input.targetValue }),
        ...(input.targetDate && { targetDate: input.targetDate ? new Date(input.targetDate) : undefined }),
      }
    });
  }

  // LOG AUDIT TRAIL
  if (input.targetValue !== undefined && goal.targetValue !== input.targetValue) {
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        changedById: userId,
        fieldName: 'targetValue',
        oldValue: goal.targetValue != null ? String(goal.targetValue) : '0',
        newValue: String(input.targetValue),
      },
    });
  }

  if (input.weightage !== undefined && goal.weightage !== input.weightage) {
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        changedById: userId,
        fieldName: 'weightage',
        oldValue: String(goal.weightage),
        newValue: String(input.weightage),
      },
    });
  }

  return updatedGoal;
}

export async function deleteGoal(goalId: string, userId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error('Goal not found.');
  if (goal.status === GoalStatus.APPROVED) throw new Error('Approved goals cannot be deleted.');
  return prisma.goal.delete({ where: { id: goalId } });
}

export async function submitGoalSheet(userId: string) {
  const cycle = await getActiveCycle();
  if (!cycle) throw new Error('No active cycle found.');

  const goals = await prisma.goal.findMany({ where: { userId, cycleId: cycle.id } });
  const { valid, errors } = validateGoalSheet(goals.map((g) => ({ weightage: g.weightage })));
  if (!valid) throw new Error(errors.join(' '));

  await prisma.goal.updateMany({
    where: { userId, cycleId: cycle.id, status: GoalStatus.DRAFT },
    data: { status: GoalStatus.SUBMITTED },
  });

  // LOG AUDIT TRAIL
  await prisma.auditLog.create({
    data: {
      entityType: 'GoalSheet',
      entityId: userId,
      changedById: userId,
      fieldName: 'status',
      oldValue: 'DRAFT',
      newValue: 'SUBMITTED',
    },
  });

  return { submitted: true };
}

export async function submitCheckIn(
  goalId: string,
  userId: string,
  data: {
    cyclePhase: CyclePhase;
    actualValue?: number;
    actualDate?: string;
    progressStatus: string;
  }
) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error('Goal not found.');
  if (goal.status !== GoalStatus.APPROVED) throw new Error('Goal must be approved before logging check-ins.');

  const score = computeScore(
    goal.uomType,
    goal.targetValue,
    goal.targetDate,
    data.actualValue ?? null,
    data.actualDate ? new Date(data.actualDate) : null
  );

  const checkIn = await prisma.checkIn.create({
    data: {
      goalId,
      cyclePhase: data.cyclePhase,
      actualValue: data.actualValue,
      actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
      progressStatus: data.progressStatus as any,
      computedScore: score,
    },
  });

  // LOG AUDIT TRAIL
  await prisma.auditLog.create({
    data: {
      entityType: 'CheckIn',
      entityId: goalId,
      changedById: userId,
      fieldName: data.cyclePhase,
      oldValue: null,
      newValue: data.actualValue != null ? String(data.actualValue) : 'Checked In',
    },
  });

  // PROPAGATE / SYNC CHECK-IN TO ALL SHARED COPIES!
  if (goal.isShared) {
    const copies = await prisma.goal.findMany({ where: { parentGoalId: goalId } });
    for (const copy of copies) {
      await prisma.checkIn.create({
        data: {
          goalId: copy.id,
          cyclePhase: data.cyclePhase,
          actualValue: data.actualValue,
          actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
          progressStatus: data.progressStatus as any,
          computedScore: score,
        }
      });
    }
  }

  return checkIn;
}

// ==========================================
// MANAGER FUNCTIONS
// ==========================================

export async function getTeamGoals(managerId: string, cycleId?: string) {
  const cycle = cycleId ? { id: cycleId } : await getActiveCycle();
  if (!cycle) return { team: [], cycle: null };

  const team = await prisma.user.findMany({
    where: { managerId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      goals: {
        where: { cycleId: cycle.id },
        include: {
          checkIns: { orderBy: { checkedInAt: 'desc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return { team, cycle };
}

export async function approveGoalSheet(managerId: string, employeeId: string) {
  const employee = await prisma.user.findFirst({ where: { id: employeeId, managerId } });
  if (!employee) throw new Error('Employee not found or not a direct report.');

  const cycle = await getActiveCycle();
  if (!cycle) throw new Error('No active cycle.');

  const goals = await prisma.goal.findMany({
    where: { userId: employeeId, cycleId: cycle.id, status: GoalStatus.SUBMITTED }
  });

  if (goals.length === 0) throw new Error('No submitted goals to approve.');

  await prisma.goal.updateMany({
    where: { userId: employeeId, cycleId: cycle.id, status: GoalStatus.SUBMITTED },
    data: { status: GoalStatus.APPROVED }
  });

  // LOG AUDIT TRAIL
  await prisma.auditLog.create({
    data: {
      entityType: 'GoalSheet',
      entityId: employeeId,
      changedById: managerId,
      fieldName: 'status',
      oldValue: 'SUBMITTED',
      newValue: 'APPROVED',
    },
  });

  return prisma.approval.create({
    data: {
      managerId,
      goalSheetUserId: employeeId,
      cycleId: cycle.id,
      action: 'APPROVED'
    }
  });
}

export async function returnGoalSheet(managerId: string, employeeId: string, comment: string) {
  const employee = await prisma.user.findFirst({ where: { id: employeeId, managerId } });
  if (!employee) throw new Error('Employee not found or not a direct report.');

  const cycle = await getActiveCycle();
  if (!cycle) throw new Error('No active cycle.');

  await prisma.goal.updateMany({
    where: { userId: employeeId, cycleId: cycle.id, status: GoalStatus.SUBMITTED },
    data: { status: GoalStatus.RETURNED }
  });

  // LOG AUDIT TRAIL
  await prisma.auditLog.create({
    data: {
      entityType: 'GoalSheet',
      entityId: employeeId,
      changedById: managerId,
      fieldName: 'status',
      oldValue: 'SUBMITTED',
      newValue: 'RETURNED',
    },
  });

  return prisma.approval.create({
    data: {
      managerId,
      goalSheetUserId: employeeId,
      cycleId: cycle.id,
      action: 'RETURNED',
      comment
    }
  });
}

export async function addManagerCommentToCheckIn(managerId: string, checkInId: string, comment: string) {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { goal: { include: { user: true } } }
  });

  if (!checkIn) throw new Error('Check-in not found.');
  if (checkIn.goal.user.managerId !== managerId) {
    throw new Error('Not authorized to comment on this check-in.');
  }

  const updatedCheckIn = await prisma.checkIn.update({
    where: { id: checkInId },
    data: { managerComment: comment }
  });

  // LOG AUDIT TRAIL
  await prisma.auditLog.create({
    data: {
      entityType: 'CheckIn',
      entityId: checkInId,
      changedById: managerId,
      fieldName: 'managerComment',
      oldValue: checkIn.managerComment,
      newValue: comment,
    },
  });

  return updatedCheckIn;
}

export async function getAuditLogsForManager(managerId: string) {
  const employees = await prisma.user.findMany({
    where: { managerId },
    select: { id: true },
  });
  const employeeIds = employees.map((e) => e.id);

  return prisma.auditLog.findMany({
    where: {
      OR: [
        { changedById: { in: [managerId, ...employeeIds] } },
        { entityType: 'GoalSheet', entityId: { in: employeeIds } },
      ],
    },
    include: {
      changedBy: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { changedAt: 'desc' },
  });
}

export async function pushSharedGoal(managerId: string, goalId: string, employeeIds: string[]) {
  const parentGoal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true }
  });
  if (!parentGoal) throw new Error('Primary goal not found.');

  const pusher = await prisma.user.findUnique({ where: { id: managerId } });
  if (!pusher) throw new Error('Manager not found.');

  const isPusherAdmin = pusher.role === 'ADMIN';

  // Mark parent goal as shared
  await prisma.goal.update({
    where: { id: goalId },
    data: { isShared: true }
  });

  const createdGoals = [];

  for (const empId of employeeIds) {
    const employee = await prisma.user.findUnique({ where: { id: empId } });
    if (!employee) continue;

    if (!isPusherAdmin && employee.managerId !== managerId) {
      throw new Error(`You are not authorized to push goals to employee ${employee.name}`);
    }

    const existingCopy = await prisma.goal.findFirst({
      where: { userId: empId, parentGoalId: goalId }
    });
    if (existingCopy) continue;

    const newGoal = await prisma.goal.create({
      data: {
        userId: empId,
        cycleId: parentGoal.cycleId,
        thrustArea: parentGoal.thrustArea,
        title: parentGoal.title,
        description: parentGoal.description,
        uomType: parentGoal.uomType,
        targetValue: parentGoal.targetValue,
        targetDate: parentGoal.targetDate,
        weightage: 10, // Minimum weightage
        status: GoalStatus.DRAFT,
        parentGoalId: goalId
      }
    });

    createdGoals.push(newGoal);

    // LOG AUDIT TRAIL
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: newGoal.id,
        changedById: managerId,
        fieldName: 'parentGoalId',
        oldValue: null,
        newValue: goalId,
      },
    });
  }

  return { success: true, count: createdGoals.length };
}

export async function exportAchievementsCSV(userId: string): Promise<string> {
  const pusher = await prisma.user.findUnique({ where: { id: userId } });
  if (!pusher) throw new Error('User not found.');
  if (pusher.role !== 'ADMIN' && pusher.role !== 'MANAGER') {
    throw new Error('Not authorized to export organizational achievement reports.');
  }

  const allUsers = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      manager: true,
      goals: {
        include: {
          checkIns: { orderBy: { checkedInAt: 'desc' } }
        }
      }
    }
  });

  let csvContent = 'Employee Name,Employee Email,Department,Manager,Thrust Area,Goal Title,UoM Type,Planned Target,Actual Achievement,Progress Status,Completion Score%\n';

  for (const u of allUsers) {
    for (const g of u.goals) {
      const latestCheckIn = g.checkIns[0];
      const actualVal = latestCheckIn?.actualValue != null ? latestCheckIn.actualValue : 'N/A';
      const progress = latestCheckIn?.progressStatus || 'NOT_STARTED';
      const score = latestCheckIn?.computedScore != null ? `${latestCheckIn.computedScore.toFixed(1)}%` : '0%';
      const targetVal = g.uomType === 'TIMELINE' 
        ? (g.targetDate ? g.targetDate.toISOString().split('T')[0] : 'N/A')
        : (g.targetValue != null ? String(g.targetValue) : 'N/A');

      // Escape double quotes for CSV safety
      const cleanTitle = g.title.replace(/"/g, '""');
      const cleanDept = (u.department || 'General').replace(/"/g, '""');
      const managerName = u.manager ? u.manager.name : 'None';

      csvContent += `"${u.name}","${u.email}","${cleanDept}","${managerName}","${g.thrustArea}","${cleanTitle}","${g.uomType}","${targetVal}","${actualVal}","${progress}","${score}"\n`;
    }
  }

  return csvContent;
}
