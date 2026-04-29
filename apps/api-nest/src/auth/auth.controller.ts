import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ROLE_CODES } from './constants/roles';
import { AuthenticatedRequest } from '../common/types/authenticated-request';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('register-tenant')
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: AuthenticatedRequest) {
    return this.authService.profile(req.user.userId);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE_CODES.SUPER_ADMIN, ROLE_CODES.TENANT_ADMIN)
  createUser(@Req() req: AuthenticatedRequest, @Body() dto: CreateUserDto) {
    return this.authService.createUser(req.user, dto);
  }
}
