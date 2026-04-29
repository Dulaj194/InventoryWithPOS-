import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './common/audit/audit.module';
import { IdempotencyModule } from './common/idempotency/idempotency.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { InventoryModule } from './inventory/inventory.module';
import { PosModule } from './pos/pos.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SettingsRequestsModule } from './settings-requests/settings-requests.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 240,
      },
    ]),
    PrismaModule,
    RedisModule,
    AuditModule,
    IdempotencyModule,
    RealtimeModule,
    AuthModule,
    TenantsModule,
    InventoryModule,
    PosModule,
    SettingsRequestsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
