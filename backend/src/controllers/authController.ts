import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import crypto from 'crypto';
import { env } from '../utils/env';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ id: userId, role }, env.jwtSecret, { expiresIn: '15m' });
  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ id: userId, jti }, env.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken, jti };
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Set the refresh token as HttpOnly cookie
  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.json({ accessToken, user: { id: user.id, name: user.name, role: user.role } });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as { id: string, jti: string };
    
    // Check if token was revoked
    const revoked = await prisma.revokedToken.findUnique({ where: { jti: decoded.jti } });
    if (revoked) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Revoke old token
    await prisma.revokedToken.create({
      data: {
        jti: decoded.jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const tokens = generateTokens(user.id, user.role);

    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as { jti: string };
      await prisma.revokedToken.upsert({
        where: { jti: decoded.jti },
        update: {},
        create: {
          jti: decoded.jti,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (e) {
      // Ignore if token is invalid
    }
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out successfully' });
};
