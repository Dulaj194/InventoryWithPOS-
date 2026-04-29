import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admin can access any tenant
    if (user.isSuperAdmin) {
      return true;
    }

    // Regular users must have tenant context
    if (!user.tenantId) {
      throw new ForbiddenException(
        'Tenant context required for this operation',
      );
    }

    return true;
  }
}
