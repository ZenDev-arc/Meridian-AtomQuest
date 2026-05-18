import api from './axios';

export type CyclePhase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type Cycle = {
  id: string;
  name: string;
  phase: CyclePhase;
  windowOpen: string;
  windowClose: string;
  isActive: boolean;
};

export type DeptStat = {
  department: string;
  totalEmployees: number;
  totalGoals: number;
  submittedSheets: number;
  approvedSheets: number;
  averageProgressScore: number;
};

export type AdminAnalytics = {
  totalEmployees: number;
  totalManagers: number;
  sheets: {
    draft: number;
    submitted: number;
    approved: number;
    returned: number;
  };
  goals: {
    notStarted: number;
    onTrack: number;
    completed: number;
    total: number;
  };
  departments: DeptStat[];
};

export const adminApi = {
  getCycles: () => api.get<Cycle[]>('/admin/cycles'),
  updateCycle: (id: string, data: Partial<Cycle>) => api.patch<Cycle>(`/admin/cycles/${id}`, data),
  createCycle: (data: Omit<Cycle, 'id'>) => api.post<Cycle>('/admin/cycles', data),
  getAnalytics: () => api.get<AdminAnalytics>('/admin/analytics'),
};
