import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getMyGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  submitGoalSheet,
  submitCheckIn,
  getTeamGoals,
  approveTeamGoalSheet,
  returnTeamGoalSheet,
  commentOnCheckIn,
  getAuditLogs,
  exportAchievements,
  pushSharedGoal,
} from '../controllers/goalController';

const router = Router();

router.use(authenticate);

router.get('/audit-logs', getAuditLogs);
router.get('/export-achievements', exportAchievements);
router.get('/', getMyGoals);
router.post('/', createGoal);
router.post('/shared/push', pushSharedGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/submit', submitGoalSheet);
router.post('/:id/checkin', submitCheckIn);

// Manager routes
router.get('/team', getTeamGoals);
router.post('/team/:employeeId/approve', approveTeamGoalSheet);
router.post('/team/:employeeId/return', returnTeamGoalSheet);
router.post('/checkin/:checkInId/comment', commentOnCheckIn);

export default router;
