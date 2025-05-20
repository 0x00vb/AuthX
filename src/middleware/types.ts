import { Request } from 'express';
import { User } from '../models';

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

export interface AuthMiddlewareOptions {
  throwError?: boolean;
  includeRoles?: boolean;
}

export interface RoleMiddlewareOptions {
  throwError?: boolean;
} 