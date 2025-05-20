export type DatabaseType = 'mongodb' | 'postgres' | 'mysql';
export interface AuthXConfig {
    port: number;
    nodeEnv: string;
    dbType: DatabaseType;
    dbUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenSecret: string;
    refreshTokenExpiresIn: string;
    emailService: string;
    emailHost: string;
    emailPort: number;
    emailUser: string;
    emailPassword: string;
    emailFrom: string;
    rateLimitWindowMs: number;
    rateLimitMax: number;
    roles: string[];
    defaultRole: string;
}
