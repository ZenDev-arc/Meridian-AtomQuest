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
  origin: (origin, callback) => {
    // Allow same-origin (no origin header) and any configured frontend URL
    const allowed = [env.frontendUrl, 'http://localhost:5173', 'http://localhost:4173'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
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
