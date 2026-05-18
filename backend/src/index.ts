import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import goalRoutes from './routes/goalRoutes';
import adminRoutes from './routes/adminRoutes';
import dns from 'dns';
import { env } from './utils/env';

// Fix for Node.js native fetch failing with Neon on machines without IPv6
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const port = env.port;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
