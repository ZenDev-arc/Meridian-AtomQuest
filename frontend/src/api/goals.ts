import api from './axios';

export type Goal = {
  id: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: 'MIN' | 'MAX' | 'TIMELINE' | 'ZERO';
  targetValue?: number;
  targetDate?: string;
  weightage: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';
  lockedAt?: string;
  checkIns: CheckIn[];
};

export type CheckIn = {
  id: string;
  cyclePhase: string;
  actualValue?: number;
  actualDate?: string;
  progressStatus: 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';
  computedScore?: number;
  managerComment?: string;
};

export type Cycle = {
  id: string;
  name: string;
  phase: string;
  windowOpen: string;
  windowClose: string;
  isActive: boolean;
};

export const goalsApi = {
  getMyGoals: () => api.get<{ goals: Goal[]; cycle: Cycle | null }>('/goals'),
  createGoal: (data: Partial<Goal>) => api.post<Goal>('/goals', data),
  updateGoal: (id: string, data: Partial<Goal>) => api.patch<Goal>(`/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete(`/goals/${id}`),
  submitSheet: () => api.post('/goals/submit'),
  submitCheckIn: (goalId: string, data: Partial<CheckIn> & { cyclePhase: string }) =>
    api.post<CheckIn>(`/goals/${goalId}/checkin`, data),
    
  // Manager endpoints
  getTeamGoals: () => api.get<{ team: any[]; cycle: Cycle }>('/goals/team'),
  approveTeamGoalSheet: (employeeId: string) => api.post(`/goals/team/${employeeId}/approve`),
  returnTeamGoalSheet: (employeeId: string, comment: string) => api.post(`/goals/team/${employeeId}/return`, { comment }),
  commentOnCheckIn: (checkInId: string, comment: string) => api.post(`/goals/checkin/${checkInId}/comment`, { comment }),
  getAuditLogs: () => api.get<any[]>('/goals/audit-logs'),
  exportAchievements: () => api.get('/goals/export-achievements', { responseType: 'blob' }),
  pushSharedGoal: (data: { goalId: string; employeeIds: string[] }) => api.post('/goals/shared/push', data),
};
