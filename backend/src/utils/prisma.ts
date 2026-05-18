import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Force absolute path to .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

export default prisma;
