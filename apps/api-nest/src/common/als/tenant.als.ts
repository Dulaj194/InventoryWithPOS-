import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId: string;
  isSuperAdmin: boolean;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();
