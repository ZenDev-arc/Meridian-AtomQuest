import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getCycles, updateCycle, createCycle, getAdminAnalytics } from '../controllers/adminController';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/cycles', getCycles);
router.post('/cycles', createCycle);
router.patch('/cycles/:id', updateCycle);
router.get('/analytics', getAdminAnalytics);

export default router;
