import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockAction } from '../generated/prisma';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUserContext } from '../common/types/authenticated-request';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class InventoryService {
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async listCategories(user: AuthUserContext) {
    const tenantId = this.requireTenant(user);
    const data = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return { success: true, data };
  }

  async createCategory(user: AuthUserContext, dto: CreateCategoryDto) {
    const tenantId = this.requireTenant(user);
    const slug = this.slugify(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: {
        tenantId,
        slug,
      },
    });

    if (existing) {
      throw new BadRequestException('Category with same name already exists');
    }

    const created = await this.prisma.category.create({
      data: {
        tenantId,
        name: dto.name,
        slug,
        description: dto.description,
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'CATEGORY',
      entityId: created.id,
    });

    return { success: true, data: created };
  }

  async listProducts(user: AuthUserContext, lowStockOnly: boolean) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.product.findMany({
      where: {
        tenantId,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = lowStockOnly
      ? data.filter(
          (product) =>
            Number(product.quantityOnHand) <= Number(product.reorderLevel),
        )
      : data;

    return { success: true, data: filtered };
  }

  async createProduct(user: AuthUserContext, dto: CreateProductDto) {
    const tenantId = this.requireTenant(user);

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          tenantId,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found in tenant scope');
      }
    }

    const duplicate = await this.prisma.product.findFirst({
      where: {
        tenantId,
        sku: dto.sku,
      },
    });

    if (duplicate) {
      throw new BadRequestException('SKU already exists in this tenant');
    }

    const created = await this.prisma.product.create({
      data: {
        tenantId,
        categoryId: dto.categoryId,
        sku: dto.sku,
        barcode: dto.barcode,
        name: dto.name,
        unit: dto.unit || 'PCS',
        salePrice: dto.salePrice,
        costPrice: dto.costPrice ?? 0,
        taxRate: dto.taxRate ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'PRODUCT',
      entityId: created.id,
      payload: { sku: created.sku },
    });

    return { success: true, data: created };
  }

  async listSuppliers(user: AuthUserContext) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return { success: true, data };
  }

  async createSupplier(user: AuthUserContext, dto: CreateSupplierDto) {
    const tenantId = this.requireTenant(user);

    const exists = await this.prisma.supplier.findFirst({
      where: {
        tenantId,
        code: dto.code,
      },
    });

    if (exists) {
      throw new BadRequestException(
        'Supplier code already exists in this tenant',
      );
    }

    const created = await this.prisma.supplier.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
    });

    await this.audit.log({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'SUPPLIER',
      entityId: created.id,
    });

    return { success: true, data: created };
  }

  async createPurchase(user: AuthUserContext, dto: CreatePurchaseDto) {
    const tenantId = this.requireTenant(user);

    const outlet = await this.prisma.outlet.findFirst({
      where: {
        id: dto.outletId,
        tenantId,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found for this tenant');
    }

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: dto.supplierId,
          tenantId,
        },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found for this tenant');
      }
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products do not belong to this tenant',
      );
    }

    const productsMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const subTotal = dto.items.reduce((acc, item) => {
      return acc + item.quantity * item.unitCost;
    }, 0);

    const createdPurchase = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          tenantId,
          outletId: dto.outletId,
          supplierId: dto.supplierId,
          invoiceNo: dto.invoiceNo,
          purchaseDate: new Date(dto.purchaseDate),
          subTotal,
          taxTotal: 0,
          totalAmount: subTotal,
          notes: dto.notes,
          createdById: user.userId,
        },
      });

      await tx.purchaseItem.createMany({
        data: dto.items.map((item) => ({
          purchaseId: purchase.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal: item.quantity * item.unitCost,
        })),
      });

      const aggregate = new Map<
        string,
        { quantity: number; unitCost: number }
      >();
      for (const item of dto.items) {
        const previous = aggregate.get(item.productId) || {
          quantity: 0,
          unitCost: item.unitCost,
        };
        aggregate.set(item.productId, {
          quantity: previous.quantity + item.quantity,
          unitCost: item.unitCost,
        });
      }

      for (const [productId, aggregateItem] of aggregate.entries()) {
        const product = productsMap.get(productId);
        if (!product) {
          continue;
        }

        const balanceAfter =
          Number(product.quantityOnHand) + aggregateItem.quantity;

        await tx.product.update({
          where: { id: productId },
          data: {
            quantityOnHand: balanceAfter,
            costPrice: aggregateItem.unitCost,
          },
        });

        await tx.stockLedger.create({
          data: {
            tenantId,
            outletId: dto.outletId,
            productId,
            action: StockAction.PURCHASE,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            quantityIn: aggregateItem.quantity,
            quantityOut: 0,
            balanceAfter,
            unitCost: aggregateItem.unitCost,
            createdById: user.userId,
          },
        });
      }

      return purchase;
    });

    await this.audit.log({
      tenantId,
      userId: user.userId,
      action: 'CREATE',
      entity: 'PURCHASE',
      entityId: createdPurchase.id,
      payload: {
        itemCount: dto.items.length,
        total: subTotal,
      },
    });

    this.realtime.emitTenant(tenantId, 'inventory:purchase-posted', {
      purchaseId: createdPurchase.id,
      totalAmount: createdPurchase.totalAmount,
      at: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Purchase posted and stock updated',
      data: createdPurchase,
    };
  }

  async listPurchases(user: AuthUserContext) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.purchase.findMany({
      where: { tenantId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      take: 100,
    });

    return { success: true, data };
  }

  async stockLedger(user: AuthUserContext, productId?: string) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.stockLedger.findMany({
      where: {
        tenantId,
        productId,
      },
      include: {
        product: true,
        outlet: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    });

    return { success: true, data };
  }
}
