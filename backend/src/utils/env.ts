const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;

  if (fallback !== undefined && !isProduction) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
  isProduction,
  port: process.env.PORT || '4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: requireEnv('JWT_SECRET', 'dev_access_secret_change_me'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
};
