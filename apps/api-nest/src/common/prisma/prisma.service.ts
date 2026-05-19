import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantContext } from '../als/tenant.als';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  
  // This gets the context-aware Prisma client with RLS-like global filtering
  get extended() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const context = tenantContext.getStore();
            
            // Models that we know are globally shared and should NOT have automatic tenant filtering
            const globalModels = ['Tenant', 'User', 'Plan', 'Role', 'Permission'];
            
            if (context?.tenantId && !context.isSuperAdmin && !globalModels.includes(model)) {
              // Automatically Inject tenantId into the query args to prevent Data Leaks
              const anyArgs = args as any;
              
              if (['findFirst', 'findMany', 'updateMany', 'deleteMany', 'count'].includes(operation)) {
                anyArgs.where = { ...anyArgs.where, tenantId: context.tenantId };
              } else if (['findUnique', 'findUniqueOrThrow', 'update', 'delete'].includes(operation)) {
                // For operations requiring a unique identifier, we still inject tenantId to ensure ownership
                // Note: This requires the schema to have @@unique([tenantId, id]) or similar, 
                // but since IDs are CUIDs (globally unique), we could technically skip it. 
                // We'll inject it for strictness.
                anyArgs.where = { ...anyArgs.where, tenantId: context.tenantId };
              } else if (['create', 'createMany'].includes(operation)) {
                if (anyArgs.data) {
                   anyArgs.data = Array.isArray(anyArgs.data) 
                     ? anyArgs.data.map((d: any) => ({ ...d, tenantId: context.tenantId }))
                     : { ...anyArgs.data, tenantId: context.tenantId };
                }
              }
            }
            return query(args);
          },
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
