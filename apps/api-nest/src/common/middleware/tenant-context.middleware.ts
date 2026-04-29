import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user?.tenantId) {
      req.tenantId = req.user.tenantId;
      req.outletId = req.user.outletId;
      req.userId = req.user.userId;
      req.isSuperAdmin = req.user.isSuperAdmin;
    }

    next();
  }
}
