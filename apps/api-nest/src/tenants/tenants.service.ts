import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listAll() {
    const data = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          orderBy: { endsAt: 'desc' },
          take: 1,
        },
      },
    });

    return { success: true, data };
  }

  async listPending() {
    const data = await this.prisma.tenant.findMany({
      where: { status: TenantStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data };
  }

  async approve(tenantId: string, reviewerId: string, notes?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const updatedTenant = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.ACTIVE,
          approvalNotes: notes,
        },
      });

      const latestSubscription = await tx.subscription.findFirst({
        where: { tenantId },
        orderBy: { endsAt: 'desc' },
      });

      if (latestSubscription) {
        await tx.subscription.update({
          where: { id: latestSubscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            startsAt: now,
            endsAt: trialEnd,
          },
        });
      }

      return updated;
    });

    await this.audit.log({
      tenantId,
      userId: reviewerId,
      action: 'APPROVE',
      entity: 'TENANT',
      entityId: tenantId,
      payload: { notes },
    });

    this.realtime.emitSystem('tenant:approved', {
      tenantId,
      status: TenantStatus.ACTIVE,
    });

    return {
      success: true,
      message: 'Tenant approved and trial activated for 30 days.',
      data: updatedTenant,
    };
  }

  async reject(tenantId: string, reviewerId: string, notes?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: TenantStatus.REJECTED,
          approvalNotes: notes,
        },
      });

      await tx.subscription.updateMany({
        where: {
          tenantId,
          status: {
            in: [
              SubscriptionStatus.TRIAL,
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.GRACE,
            ],
          },
        },
        data: {
          status: SubscriptionStatus.CANCELLED,
        },
      });

      return updated;
    });

    await this.audit.log({
      tenantId,
      userId: reviewerId,
      action: 'REJECT',
      entity: 'TENANT',
      entityId: tenantId,
      payload: { notes },
    });

    this.realtime.emitSystem('tenant:rejected', {
      tenantId,
      status: TenantStatus.REJECTED,
    });

    return {
      success: true,
      message: 'Tenant registration rejected.',
      data: updatedTenant,
    };
  }

  async me(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { endsAt: 'desc' },
          take: 1,
        },
        outlets: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      success: true,
      data: tenant,
    };
  }
}
