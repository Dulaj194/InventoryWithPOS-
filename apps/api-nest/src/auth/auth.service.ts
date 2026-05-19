import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  SubscriptionStatus,
  TenantStatus,
  User,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUserContext } from '../common/types/authenticated-request';
import { ROLE_CODES } from './constants/roles';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  private buildToken(user: User, roles: string[]) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId ?? undefined,
      outletId: user.outletId ?? undefined,
      roles,
      isSuperAdmin: user.isSuperAdmin,
    });
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is blocked');
    }

    const validPassword = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roleCodes = user.userRoles.map((userRole) => userRole.role.code);

    if (!user.isSuperAdmin) {
      if (!user.tenantId || !user.tenant) {
        throw new ForbiddenException('Tenant context missing for this user');
      }

      if (user.tenant.status === TenantStatus.PENDING) {
        throw new ForbiddenException(
          'Tenant registration is pending super admin approval',
        );
      }

      if (user.tenant.status === TenantStatus.REJECTED) {
        throw new ForbiddenException('Tenant registration has been rejected');
      }

      if (user.tenant.status === TenantStatus.SUSPENDED) {
        throw new ForbiddenException('Tenant is suspended. Contact support.');
      }

      const subscription = await this.prisma.subscription.findFirst({
        where: {
          tenantId: user.tenantId,
          status: {
            in: [
              SubscriptionStatus.TRIAL,
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.GRACE,
            ],
          },
        },
        orderBy: {
          endsAt: 'desc',
        },
      });

      if (!subscription) {
        throw new ForbiddenException(
          'No active subscription found for this tenant',
        );
      }

      if (subscription.endsAt < new Date()) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        throw new ForbiddenException('Subscription has expired');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const token = this.buildToken(user, roleCodes);

    return {
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          tenantId: user.tenantId,
          outletId: user.outletId,
          roles: roleCodes,
          isSuperAdmin: user.isSuperAdmin,
        },
      },
    };
  }

  async registerTenant(registerDto: RegisterTenantDto) {
    const [existingTenantByCode, existingTenantByEmail, existingUserByEmail] =
      await Promise.all([
        this.prisma.tenant.findUnique({
          where: { code: registerDto.tenantCode },
        }),
        this.prisma.tenant.findUnique({
          where: { email: registerDto.businessEmail },
        }),
        this.prisma.user.findUnique({
          where: { email: registerDto.adminEmail },
        }),
      ]);

    if (existingTenantByCode) {
      throw new BadRequestException('Tenant code already exists');
    }

    if (existingTenantByEmail) {
      throw new BadRequestException('Business email already exists');
    }

    if (existingUserByEmail) {
      throw new BadRequestException('Admin email already exists');
    }

    const starterPlan = await this.prisma.plan.findUnique({
      where: { code: 'STARTER' },
    });
    if (!starterPlan) {
      throw new BadRequestException('STARTER plan is missing. Run seed first.');
    }

    const passwordHash = await bcrypt.hash(registerDto.adminPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          code: registerDto.tenantCode,
          name: registerDto.tenantName,
          email: registerDto.businessEmail,
          phone: registerDto.businessPhone,
          status: TenantStatus.PENDING,
        },
      });

      const outlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          code: 'MAIN',
          name:
            registerDto.outletName || `${registerDto.tenantName} Main Outlet`,
          isMain: true,
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          outletId: outlet.id,
          email: registerDto.adminEmail,
          fullName: registerDto.adminName,
          passwordHash,
          isSuperAdmin: false,
        },
      });

      const tenantAdminRole = await tx.role.findFirst({
        where: { code: ROLE_CODES.TENANT_ADMIN },
      });

      if (!tenantAdminRole) {
        throw new BadRequestException(
          'TENANT_ADMIN role is missing. Run seed first.',
        );
      }

      await tx.userRole.create({
        data: {
          userId: admin.id,
          roleId: tenantAdminRole.id,
        },
      });

      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: SubscriptionStatus.TRIAL,
          startsAt: now,
          endsAt: trialEnd,
        },
      });

      return { tenant, admin, outlet };
    });

    await this.auditService.log({
      tenantId: result.tenant.id,
      userId: result.admin.id,
      action: 'CREATE',
      entity: 'TENANT_REGISTRATION',
      entityId: result.tenant.id,
      payload: {
        tenantCode: result.tenant.code,
      },
    });

    return {
      success: true,
      message: 'Registration submitted. Awaiting super admin approval.',
      data: {
        tenantId: result.tenant.id,
        tenantCode: result.tenant.code,
        adminEmail: result.admin.email,
        status: result.tenant.status,
      },
    };
  }

  async createUser(actor: AuthUserContext, dto: CreateUserDto) {
    if (!actor.isSuperAdmin && !actor.tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    if (!actor.isSuperAdmin && dto.roleCode === ROLE_CODES.TENANT_ADMIN) {
      throw new ForbiddenException(
        'Only super admin can create tenant admin users',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.prisma.role.findFirst({
      where: { code: dto.roleCode },
    });
    if (!role) {
      throw new BadRequestException('Invalid role code');
    }

    const tenantId = actor.isSuperAdmin ? undefined : actor.tenantId;

    if (!tenantId) {
      throw new BadRequestException('tenantId is required for staff creation');
    }

    if (dto.outletId) {
      const outlet = await this.prisma.outlet.findFirst({
        where: {
          id: dto.outletId,
          tenantId,
        },
      });

      if (!outlet) {
        throw new BadRequestException('Invalid outlet for this tenant');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          outletId: dto.outletId,
          email: dto.email,
          fullName: dto.fullName,
          passwordHash,
          isSuperAdmin: false,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return user;
    });

    await this.auditService.log({
      tenantId,
      userId: actor.userId,
      action: 'CREATE',
      entity: 'USER',
      entityId: created.id,
      payload: {
        email: created.email,
        roleCode: dto.roleCode,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: created.id,
        email: created.email,
        fullName: created.fullName,
      },
    };
  }

  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        outletId: user.outletId,
        roles: user.userRoles.map((entry) => entry.role.code),
        isSuperAdmin: user.isSuperAdmin,
        tenantStatus: user.tenant?.status,
      },
    };
  }
}
