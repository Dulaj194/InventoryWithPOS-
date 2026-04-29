import { Request } from 'express';

export interface AuthUserContext {
  userId: string;
  tenantId?: string;
  outletId?: string;
  email: string;
  roles: string[];
  isSuperAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUserContext;
  tenantId?: string;
  outletId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}
