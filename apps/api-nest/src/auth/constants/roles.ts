export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  INVENTORY_CLERK: 'INVENTORY_CLERK',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
