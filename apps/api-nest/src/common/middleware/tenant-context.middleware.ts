import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { tenantContext } from '../als/tenant.als';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user?.tenantId) {
      req.tenantId = req.user.tenantId;
      req.outletId = req.user.outletId;
      req.userId = req.user.userId;
      req.isSuperAdmin = req.user.isSuperAdmin;

      const context = {
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        isSuperAdmin: req.user.isSuperAdmin || false,
      };

      // Wrap the rest of the request lifecycle in the ALS context
      tenantContext.run(context, () => {
        next();
      });
    } else {
      next();
    }
  }
}
