import { Request, Response } from 'express';
import * as goalService from '../services/goalService';

export const getMyGoals = async (req: Request, res: Response) => {
  try {
    const goals = await goalService.getUserGoals(req.user!.id);
    const cycle = await goalService.getActiveCycle();
    res.json({ goals, cycle });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  try {
    const goal = await goalService.createGoal(req.user!.id, req.body);
    res.status(201).json(goal);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const goal = await goalService.updateGoal(id, req.user!.id, req.body);
    res.json(goal);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await goalService.deleteGoal(id, req.user!.id);
    res.json({ deleted: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const submitGoalSheet = async (req: Request, res: Response) => {
  try {
    const result = await goalService.submitGoalSheet(req.user!.id);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const submitCheckIn = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const checkIn = await goalService.submitCheckIn(id, req.user!.id, req.body);
    res.status(201).json(checkIn);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getTeamGoals = async (req: Request, res: Response) => {
  try {
    const result = await goalService.getTeamGoals(req.user!.id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const approveTeamGoalSheet = async (req: Request, res: Response) => {
  try {
    const employeeId = String(req.params.employeeId);
    const result = await goalService.approveGoalSheet(req.user!.id, employeeId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const returnTeamGoalSheet = async (req: Request, res: Response) => {
  try {
    const employeeId = String(req.params.employeeId);
    const { comment } = req.body;
    const result = await goalService.returnGoalSheet(req.user!.id, employeeId, comment);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const commentOnCheckIn = async (req: Request, res: Response) => {
  try {
    const checkInId = String(req.params.checkInId);
    const { comment } = req.body;
    const result = await goalService.addManagerCommentToCheckIn(req.user!.id, checkInId, comment);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await goalService.getAuditLogsForManager(req.user!.id);
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const exportAchievements = async (req: Request, res: Response) => {
  try {
    const csvContent = await goalService.exportAchievementsCSV(req.user!.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="achievement_report.csv"');
    res.status(200).send(csvContent);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const pushSharedGoal = async (req: Request, res: Response) => {
  try {
    const { goalId, employeeIds } = req.body;
    const result = await goalService.pushSharedGoal(req.user!.id, goalId, employeeIds);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

