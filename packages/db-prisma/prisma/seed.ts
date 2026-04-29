import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  { code: 'tenant.read', name: 'View Tenants', resource: 'tenant', action: 'read' },
  { code: 'tenant.write', name: 'Manage Tenants', resource: 'tenant', action: 'write' },
  { code: 'user.read', name: 'View Users', resource: 'user', action: 'read' },
  { code: 'user.write', name: 'Manage Users', resource: 'user', action: 'write' },
  { code: 'inventory.read', name: 'View Inventory', resource: 'inventory', action: 'read' },
  { code: 'inventory.write', name: 'Manage Inventory', resource: 'inventory', action: 'write' },
  { code: 'purchase.write', name: 'Create Purchases', resource: 'purchase', action: 'write' },
  { code: 'order.read', name: 'View Orders', resource: 'order', action: 'read' },
  { code: 'order.write', name: 'Manage Orders', resource: 'order', action: 'write' },
  { code: 'payment.write', name: 'Record Payments', resource: 'payment', action: 'write' },
  { code: 'report.read', name: 'View Reports', resource: 'report', action: 'read' },
  { code: 'settings.approve', name: 'Approve Settings Requests', resource: 'settings', action: 'approve' },
];

const roleDefinitions: Array<{ code: string; name: string; isSystem?: boolean; permissionCodes: string[] }> = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    isSystem: true,
    permissionCodes: permissions.map((p) => p.code),
  },
  {
    code: 'TENANT_ADMIN',
    name: 'Tenant Admin',
    isSystem: true,
    permissionCodes: [
      'user.read',
      'user.write',
      'inventory.read',
      'inventory.write',
      'purchase.write',
      'order.read',
      'order.write',
      'payment.write',
      'report.read',
    ],
  },
  {
    code: 'MANAGER',
    name: 'Outlet Manager',
    isSystem: true,
    permissionCodes: [
      'user.read',
      'inventory.read',
      'inventory.write',
      'purchase.write',
      'order.read',
      'order.write',
      'payment.write',
      'report.read',
    ],
  },
  {
    code: 'CASHIER',
    name: 'Cashier',
    isSystem: true,
    permissionCodes: ['order.read', 'order.write', 'payment.write'],
  },
  {
    code: 'INVENTORY_CLERK',
    name: 'Inventory Clerk',
    isSystem: true,
    permissionCodes: ['inventory.read', 'inventory.write', 'purchase.write'],
  },
];

async function seedPermissionsAndRoles() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name, resource: permission.resource, action: permission.action },
      create: permission,
    });
  }

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { code: roleDef.code },
      update: { name: roleDef.name, isSystem: roleDef.isSystem ?? true },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        isSystem: roleDef.isSystem ?? true,
      },
    });

    for (const permissionCode of roleDef.permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (!permission) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedPlans() {
  await prisma.plan.upsert({
    where: { code: 'STARTER' },
    update: {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 299,
      maxOutlets: 1,
      maxUsers: 12,
      featureFlags: {
        inventory: true,
        pos: true,
        reports: true,
        multiOutlet: false,
      },
    },
    create: {
      code: 'STARTER',
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 299,
      maxOutlets: 1,
      maxUsers: 12,
      featureFlags: {
        inventory: true,
        pos: true,
        reports: true,
        multiOutlet: false,
      },
    },
  });

  await prisma.plan.upsert({
    where: { code: 'GROWTH' },
    update: {
      name: 'Growth',
      monthlyPrice: 99,
      annualPrice: 999,
      maxOutlets: 5,
      maxUsers: 100,
      featureFlags: {
        inventory: true,
        pos: true,
        reports: true,
        multiOutlet: true,
        advancedAnalytics: true,
      },
    },
    create: {
      code: 'GROWTH',
      name: 'Growth',
      monthlyPrice: 99,
      annualPrice: 999,
      maxOutlets: 5,
      maxUsers: 100,
      featureFlags: {
        inventory: true,
        pos: true,
        reports: true,
        multiOutlet: true,
        advancedAnalytics: true,
      },
    },
  });
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@mypos.local';
  const plainPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email },
    update: {
      fullName: 'System Super Admin',
      passwordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
    create: {
      email,
      fullName: 'System Super Admin',
      passwordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  if (!superAdminRole) {
    return;
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });
}

async function seedDemoTenant() {
  const tenantCode = 'DEMO';
  const tenant = await prisma.tenant.upsert({
    where: { code: tenantCode },
    update: {},
    create: {
      code: tenantCode,
      name: 'Demo Shop',
      email: 'demo@mypos.local',
      status: 'ACTIVE',
    },
  });

  const outlet = await prisma.outlet.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MAIN' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'MAIN',
      name: 'Main Branch',
      isMain: true,
    },
  });

  const cashierEmail = 'cashier@demo.local';
  const passwordHash = await bcrypt.hash('Cashier123!', 10);
  
  const cashierUser = await prisma.user.upsert({
    where: { email: cashierEmail },
    update: { tenantId: tenant.id, outletId: outlet.id },
    create: {
      email: cashierEmail,
      fullName: 'Demo Cashier',
      passwordHash,
      tenantId: tenant.id,
      outletId: outlet.id,
      status: 'ACTIVE',
    },
  });

  const cashierRole = await prisma.role.findUnique({ where: { code: 'CASHIER' } });
  if (cashierRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: cashierUser.id, roleId: cashierRole.id } },
      update: {},
      create: { userId: cashierUser.id, roleId: cashierRole.id },
    });
  }
}

async function main() {
  await seedPermissionsAndRoles();
  await seedPlans();
  await seedSuperAdmin();
  await seedDemoTenant();
  console.log('Database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
