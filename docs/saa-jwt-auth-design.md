# SaaS JWT Authentication Design

## JWT Payload Structure

```json
{
  "sub": "user-uuid-123",           // User ID (Subject)
  "email": "user@tenant.com",       // User Email
  "tenantId": "tenant-uuid-456",    // Tenant ID (Business)
  "outletId": "outlet-uuid-789",    // Outlet ID (Optional)
  "roles": ["CASHIER", "MANAGER"],  // User Roles
  "isSuperAdmin": false,            // Super Admin Flag
  "iat": 1640995200,                // Issued At
  "exp": 1640996100                 // Expires At
}
```

## Security Features

### 1. **Tenant Isolation**
- `tenantId` field ensures data isolation
- All database queries filter by tenant
- Prevents cross-tenant data access

### 2. **Role-Based Access Control**
- Hierarchical roles: SUPER_ADMIN > TENANT_ADMIN > MANAGER > CASHIER
- Outlet-specific permissions
- Business logic separation

### 3. **Multi-Level Guards**
- `JwtAuthGuard`: Validates token authenticity
- `RolesGuard`: Checks user permissions
- `TenantGuard`: Ensures tenant context

## Usage Examples

### Controller with Tenant Guard
```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ProductsController {
  @Get()
  @Roles(ROLE_CODES.MANAGER, ROLE_CODES.CASHIER)
  findAll(@Req() req: AuthenticatedRequest) {
    // req.user.tenantId automatically available
    return this.productsService.findByTenant(req.user.tenantId);
  }
}
```

### Service with Automatic Filtering
```typescript
@Injectable()
export class ProductsService {
  async findByTenant(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId }  // Automatic tenant filtering
    });
  }
}
```

## Token Flow

1. **Login Request**
   ```json
   POST /auth/login
   {
     "email": "cashier@restaurant.com",
     "password": "password123"
   }
   ```

2. **Token Generation**
   - Validate user credentials
   - Check tenant status & subscription
   - Generate JWT with tenant context
   - Return access token

3. **API Request**
   ```
   GET /api/products
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Automatic Context**
   - Guards validate token
   - Middleware adds tenant context
   - Services filter by tenant automatically

## Benefits for SaaS

✅ **Data Security**: Complete tenant isolation
✅ **Scalability**: Easy to add new tenants
✅ **Flexibility**: Role-based permissions per tenant
✅ **Audit Trail**: All actions tracked per tenant
✅ **Subscription Management**: Tenant-specific billing

## Role Hierarchy

```
SUPER_ADMIN (System Level)
├── Can manage all tenants
├── Can create tenant admins
└── System configuration

TENANT_ADMIN (Business Level)
├── Manage their business
├── Create managers/cashiers
└── Business settings

MANAGER (Outlet Level)
├── Manage inventory
├── View reports
└── Manage staff

CASHIER (Operational Level)
├── Process sales
├── Handle orders
└── Basic operations
```

This JWT design ensures complete SaaS security while maintaining flexibility for different business models.