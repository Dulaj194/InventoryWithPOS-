import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SettingsRequestStatus } from '../generated/prisma';
import { ROLE_CODES } from '../auth/constants/roles';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUserContext } from '../common/types/authenticated-request';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateSettingsRequestDto } from './dto/create-settings-request.dto';
import {
  ReviewAction,
  ReviewSettingsRequestDto,
} from './dto/review-settings-request.dto';

@Injectable()
export class SettingsRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private requireTenant(user: AuthUserContext): string {
    if (!user.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    return user.tenantId;
  }

  async create(user: AuthUserContext, dto: CreateSettingsRequestDto) {
    const tenantId = this.requireTenant(user);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const pending = await this.prisma.settingsRequest.findFirst({
      where: {
        tenantId,
        status: SettingsRequestStatus.PENDING,
      },
    });

    if (pending) {
      throw new BadRequestException(
        'There is already a pending settings request.',
      );
    }

    const current = {
      enableInventory: tenant.enableInventory,
      enablePos: tenant.enablePos,
      enableReports: tenant.enableReports,
      enableAccounting: tenant.enableAccounting,
      enableKds: tenant.enableKds,
    };

    const requested: Record<string, boolean> = {};
    const keys = Object.keys(current) as Array<keyof typeof current>;

    for (const key of keys) {
      const nextValue = dto[key];
      if (nextValue !== undefined && nextValue !== current[key]) {
        requested[key] = nextValue;
      }
    }

    if (Object.keys(requested).length === 0) {
      throw new BadRequestException('No effective setting changes detected');
    }

    const created = await this.prisma.settingsRequest.create({
      data: {
        tenantId,
        requestedById: user.userId,
        requestedChanges: requested,
        currentSettings: current,
        requestReason: dto.requestReason,
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'SETTINGS_REQUEST',
      entityId: created.id,
      payload: { requested },
    });

    this.realtime.emitSystem('settings-request:new', {
      requestId: created.id,
      tenantId,
      requestedById: user.userId,
      requested,
    });

    return {
      success: true,
      message: 'Settings request submitted for super admin review',
      data: created,
    };
  }

  async list(user: AuthUserContext, status?: string) {
    const where: any = user.isSuperAdmin
      ? {}
      : {
          tenantId: this.requireTenant(user),
        };

    if (status) {
      where.status = status as SettingsRequestStatus;
    }

    const data = await this.prisma.settingsRequest.findMany({
      where,
      include: {
        tenant: true,
        requestedBy: true,
        reviewedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data,
    };
  }

  async review(
    user: AuthUserContext,
    requestId: string,
    dto: ReviewSettingsRequestDto,
  ) {
    if (!user.roles.includes(ROLE_CODES.SUPER_ADMIN) && !user.isSuperAdmin) {
      throw new ForbiddenException(
        'Only super admin can review settings requests',
      );
    }

    const request = await this.prisma.settingsRequest.findUnique({
      where: { id: requestId },
      include: { tenant: true },
    });

    if (!request) {
      throw new NotFoundException('Settings request not found');
    }

    if (request.status !== SettingsRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    const approved = dto.action === ReviewAction.APPROVE;

    const updated = await this.prisma.$transaction(async (tx) => {
      const requestRow = await tx.settingsRequest.update({
        where: { id: requestId },
        data: {
          status: approved
            ? SettingsRequestStatus.APPROVED
            : SettingsRequestStatus.REJECTED,
          reviewedById: user.userId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes,
        },
      });

      if (approved) {
        const requested = request.requestedChanges as Record<string, boolean>;

        await tx.tenant.update({
          where: { id: request.tenantId },
          data: {
            enableInventory: requested.enableInventory,
            enablePos: requested.enablePos,
            enableReports: requested.enableReports,
            enableAccounting: requested.enableAccounting,
            enableKds: requested.enableKds,
          },
        });
      }

      return requestRow;
    });

    await this.audit.log({
      tenantId: request.tenantId,
      userId: user.userId,
      action: approved ? 'APPROVE' : 'REJECT',
      entity: 'SETTINGS_REQUEST',
      entityId: requestId,
      payload: {
        reviewNotes: dto.reviewNotes,
      },
    });

    this.realtime.emitTenant(request.tenantId, 'settings-request:reviewed', {
      requestId,
      status: updated.status,
      approvedSettings: approved ? request.requestedChanges : null,
    });

    return {
      success: true,
      message: approved
        ? 'Settings request approved'
        : 'Settings request rejected',
      data: updated,
    };
  }
}
