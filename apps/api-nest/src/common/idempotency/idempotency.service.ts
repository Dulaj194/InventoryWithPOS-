import { ConflictException, Injectable } from '@nestjs/common';
import { IdempotencyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type IdempotencyStartResult =
  | { mode: 'fresh'; keyId: string }
  | { mode: 'cached'; responseCode: number; responseBody: unknown };

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async start(
    tenantId: string,
    key: string,
    requestHash: string,
    ttlSeconds = 300,
  ): Promise<IdempotencyStartResult> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key,
        },
      },
    });

    const now = new Date();

    if (existing) {
      if (existing.expiresAt < now) {
        await this.prisma.idempotencyKey.delete({ where: { id: existing.id } });
      } else {
        if (existing.requestHash !== requestHash) {
          throw new ConflictException(
            'Idempotency key conflict with different request payload.',
          );
        }

        if (existing.status === IdempotencyStatus.COMPLETED) {
          return {
            mode: 'cached',
            responseCode: existing.responseCode ?? 200,
            responseBody: existing.responseBody,
          };
        }

        throw new ConflictException('This request is already being processed.');
      }
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const created = await this.prisma.idempotencyKey.create({
      data: {
        tenantId,
        key,
        requestHash,
        expiresAt,
        status: IdempotencyStatus.IN_PROGRESS,
      },
    });

    return {
      mode: 'fresh',
      keyId: created.id,
    };
  }

  async complete(
    keyId: string,
    responseCode: number,
    responseBody: unknown,
  ): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { id: keyId },
      data: {
        status: IdempotencyStatus.COMPLETED,
        responseCode,
        responseBody: responseBody as object,
      },
    });
  }

  async fail(keyId: string): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { id: keyId },
      data: { status: IdempotencyStatus.FAILED },
    });
  }
}
