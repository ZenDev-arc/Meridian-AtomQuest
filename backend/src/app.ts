import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import goalRoutes from './routes/goalRoutes';
import adminRoutes from './routes/adminRoutes';
import { env } from './utils/env';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);

export default app;
