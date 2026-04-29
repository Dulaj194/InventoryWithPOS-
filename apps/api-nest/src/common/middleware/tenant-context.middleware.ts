import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Add tenant context to request for easy access in services
    if (req.user?.tenantId) {
      (req as any).tenantId = req.user.tenantId;
      (req as any).outletId = req.user.outletId;
      (req as any).userId = req.user.userId;
      (req as any).isSuperAdmin = req.user.isSuperAdmin;
    }

    next();
  }
}