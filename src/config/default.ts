import { AuthXConfig } from './types';

export const defaultConfig: AuthXConfig = {
  // Server configuration
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  dbType: (process.env.DB_TYPE as any) || 'mongodb',
  dbUri: process.env.DB_URI || 'mongodb://localhost:27017/authx',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-token-secret-change-me',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  // Email configuration
  emailService: process.env.EMAIL_SERVICE || 'smtp',
  emailHost: process.env.EMAIL_HOST || 'smtp.example.com',
  emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  emailUser: process.env.EMAIL_USER || 'user@example.com',
  emailPassword: process.env.EMAIL_PASSWORD || 'password',
  emailFrom: process.env.EMAIL_FROM || 'noreply@authx.com',
  
  // Security
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000,
  rateLimitMax: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
  
  // Roles
  roles: process.env.ROLES ? process.env.ROLES.split(',') : ['user', 'admin'],
  defaultRole: process.env.DEFAULT_ROLE || 'user',
}; 