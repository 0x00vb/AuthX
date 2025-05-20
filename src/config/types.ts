export type DatabaseType = 'mongodb' | 'postgres' | 'mysql';

export interface AuthXConfig {
  // Server configuration
  port: number;
  nodeEnv: string;
  
  // Database configuration
  dbType: DatabaseType;
  dbUri: string;
  
  // JWT configuration
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  
  // Email configuration
  emailService: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFrom: string;
  
  // Security
  rateLimitWindowMs: number;
  rateLimitMax: number;
  
  // Roles
  roles: string[];
  defaultRole: string;
} 