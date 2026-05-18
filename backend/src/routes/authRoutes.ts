import { Router } from 'express';
import { login, refresh, logout } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Auth test route
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
