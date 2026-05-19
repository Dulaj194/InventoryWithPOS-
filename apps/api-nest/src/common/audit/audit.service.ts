import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  payload?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditInput): Promise<void> {
    try {
      // TODO: Migrate Audit logs to MongoDB / ElasticSearch. 
      // Emitting to standard output for log stash temporarily
      console.log('AUDIT_LOG:', JSON.stringify({
          tenantId: input.tenantId ?? null,
          userId: input.userId ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          payload: input.payload as object | undefined,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
      }));
    } catch {
      // Logging should never block main request flow.
    }
  }
}
