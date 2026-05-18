import { Request, Response } from 'express';
import * as adminService from '../services/adminService';

export const getCycles = async (req: Request, res: Response) => {
  try {
    const cycles = await adminService.getCycles();
    res.json(cycles);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateCycle = async (req: Request, res: Response) => {
  try {
    const cycle = await adminService.updateCycle(String(req.params.id), req.body);
    res.json(cycle);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const createCycle = async (req: Request, res: Response) => {
  try {
    const cycle = await adminService.createCycle(req.body);
    res.status(201).json(cycle);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await adminService.getAdminAnalytics();
    res.json(analytics);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
