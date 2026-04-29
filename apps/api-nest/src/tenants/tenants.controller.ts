import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_CODES } from '../auth/constants/roles';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ReviewTenantDto } from './dto/review-tenant.dto';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(ROLE_CODES.SUPER_ADMIN)
  listAll() {
    return this.tenantsService.listAll();
  }

  @Get('pending')
  @Roles(ROLE_CODES.SUPER_ADMIN)
  listPending() {
    return this.tenantsService.listPending();
  }

  @Patch(':id/approve')
  @Roles(ROLE_CODES.SUPER_ADMIN)
  approve(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReviewTenantDto,
  ) {
    return this.tenantsService.approve(id, req.user.userId, dto.notes);
  }

  @Patch(':id/reject')
  @Roles(ROLE_CODES.SUPER_ADMIN)
  reject(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReviewTenantDto,
  ) {
    return this.tenantsService.reject(id, req.user.userId, dto.notes);
  }

  @Get('me/profile')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.CASHIER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  me(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.me(req.user.tenantId as string);
  }
}
