import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_CODES } from '../auth/constants/roles';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateSettingsRequestDto } from './dto/create-settings-request.dto';
import { ReviewSettingsRequestDto } from './dto/review-settings-request.dto';
import { SettingsRequestsService } from './settings-requests.service';

@Controller('settings-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsRequestsController {
  constructor(private readonly service: SettingsRequestsService) {}

  @Post()
  @Roles(ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSettingsRequestDto,
  ) {
    return this.service.create(req.user, dto);
  }

  @Get()
  @Roles(ROLE_CODES.SUPER_ADMIN, ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER)
  list(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.service.list(req.user, status);
  }

  @Patch(':id/review')
  @Roles(ROLE_CODES.SUPER_ADMIN)
  review(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewSettingsRequestDto,
  ) {
    return this.service.review(req.user, id, dto);
  }
}
