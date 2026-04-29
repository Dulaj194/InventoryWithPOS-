import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { OrderStatus, StockAction } from '../generated/prisma';
import { AuditService } from '../common/audit/audit.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUserContext } from '../common/types/authenticated-request';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private requireTenant(user: AuthUserContext): string {
    if (!user.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    return user.tenantId;
  }

  private hashPayload(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async createOrder(
    user: AuthUserContext,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    const tenantId = this.requireTenant(user);

    const outlet = await this.prisma.outlet.findFirst({
      where: {
        id: dto.outletId,
        tenantId,
      },
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found in tenant scope');
    }

    if (dto.terminalId) {
      const terminal = await this.prisma.terminal.findFirst({
        where: {
          id: dto.terminalId,
          tenantId,
        },
      });

      if (!terminal) {
        throw new NotFoundException('Terminal not found in tenant scope');
      }
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products are invalid or inactive',
      );
    }

    const productsMap = new Map(
      products.map((product) => [product.id, product]),
    );

    const requestHash = this.hashPayload({ tenantId, dto });
    let idempotencyState: Awaited<
      ReturnType<IdempotencyService['start']>
    > | null = null;

    if (idempotencyKey) {
      idempotencyState = await this.idempotency.start(
        tenantId,
        idempotencyKey,
        requestHash,
      );
      if (idempotencyState.mode === 'cached') {
        return {
          success: true,
          cached: true,
          data: idempotencyState.responseBody,
        };
      }
    }

    try {
      let subTotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;

      const lineItems = dto.items.map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) {
          throw new BadRequestException('Invalid product in order items');
        }

        const quantity = item.quantity;
        const unitPrice = Number(product.salePrice);
        const discount = item.discount ?? 0;
        const gross = quantity * unitPrice;
        const taxableAmount = Math.max(0, gross - discount);
        const lineTax = taxableAmount * (Number(product.taxRate) / 100);
        const lineTotal = taxableAmount + lineTax;

        subTotal += gross;
        discountTotal += discount;
        taxTotal += lineTax;

        return {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice,
          discount,
          taxTotal: lineTax,
          lineTotal,
        };
      });

      const grandTotal = subTotal - discountTotal + taxTotal;

      const createdOrder = await this.prisma.$transaction(async (tx) => {
        const today = new Date();
        const dateTag = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const countToday = await tx.order.count({
          where: {
            tenantId,
            createdAt: {
              gte: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              ),
            },
          },
        });

        const orderNo = `ORD-${dateTag}-${String(countToday + 1).padStart(5, '0')}`;

        const order = await tx.order.create({
          data: {
            tenantId,
            outletId: dto.outletId,
            terminalId: dto.terminalId,
            customerId: dto.customerId,
            orderNo,
            status: OrderStatus.OPEN,
            subTotal,
            discount: discountTotal,
            taxTotal,
            grandTotal,
            paidAmount: 0,
            dueAmount: grandTotal,
            notes: dto.notes,
            createdById: user.userId,
          },
        });

        await tx.orderItem.createMany({
          data: lineItems.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxTotal: item.taxTotal,
            lineTotal: item.lineTotal,
          })),
        });

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: true,
          },
        });
      });

      if (!createdOrder) {
        throw new BadRequestException('Order creation failed');
      }

      const response = {
        orderId: createdOrder.id,
        orderNo: createdOrder.orderNo,
        grandTotal: createdOrder.grandTotal,
        status: createdOrder.status,
      };

      if (idempotencyState?.mode === 'fresh') {
        await this.idempotency.complete(idempotencyState.keyId, 201, response);
      }

      await this.audit.log({
        tenantId,
        userId: user.userId,
        action: 'CREATE',
        entity: 'ORDER',
        entityId: createdOrder.id,
        payload: {
          orderNo: createdOrder.orderNo,
          amount: createdOrder.grandTotal,
        },
      });

      this.realtime.emitTenant(tenantId, 'order:new', {
        orderId: createdOrder.id,
        orderNo: createdOrder.orderNo,
        amount: createdOrder.grandTotal,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (idempotencyState?.mode === 'fresh') {
        await this.idempotency.fail(idempotencyState.keyId);
      }
      throw error;
    }
  }

  async checkoutOrder(
    user: AuthUserContext,
    orderId: string,
    dto: CheckoutOrderDto,
    idempotencyKey?: string,
  ) {
    const tenantId = this.requireTenant(user);

    const requestHash = this.hashPayload({ tenantId, orderId, dto });
    let idempotencyState: Awaited<
      ReturnType<IdempotencyService['start']>
    > | null = null;

    if (idempotencyKey) {
      idempotencyState = await this.idempotency.start(
        tenantId,
        idempotencyKey,
        requestHash,
      );
      if (idempotencyState.mode === 'cached') {
        return {
          success: true,
          cached: true,
          data: idempotencyState.responseBody,
        };
      }
    }

    try {
      const order = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          tenantId,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('Order is already paid');
      }

      if (order.status === OrderStatus.VOID) {
        throw new BadRequestException('Cannot checkout a void order');
      }

      const productIds = [
        ...new Set(order.items.map((item) => item.productId)),
      ];
      const products = await this.prisma.product.findMany({
        where: {
          tenantId,
          id: {
            in: productIds,
          },
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of order.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException(`Product missing: ${item.productId}`);
        }

        if (Number(product.quantityOnHand) < Number(item.quantity)) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }
      }

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        const newPaidAmount = Number(order.paidAmount) + dto.amount;
        const dueAmount = Math.max(0, Number(order.grandTotal) - newPaidAmount);
        const nextStatus =
          dueAmount === 0 ? OrderStatus.PAID : OrderStatus.OPEN;

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: dto.amount,
            method: dto.method,
            referenceNo: dto.referenceNo,
            receivedById: user.userId,
          },
        });

        if (dto.amount > 0) {
          for (const item of order.items) {
            const product = productMap.get(item.productId);
            if (!product) {
              continue;
            }

            const balanceAfter =
              Number(product.quantityOnHand) - Number(item.quantity);

            await tx.product.update({
              where: { id: product.id },
              data: {
                quantityOnHand: balanceAfter,
              },
            });

            await tx.stockLedger.create({
              data: {
                tenantId,
                outletId: order.outletId,
                productId: product.id,
                action: StockAction.SALE,
                referenceType: 'ORDER',
                referenceId: order.id,
                quantityIn: 0,
                quantityOut: item.quantity,
                balanceAfter,
                unitCost: product.costPrice,
                createdById: user.userId,
              },
            });
          }
        }

        const saved = await tx.order.update({
          where: { id: order.id },
          data: {
            paidAmount: newPaidAmount,
            dueAmount,
            status: nextStatus,
          },
        });

        return {
          order: saved,
          payment,
        };
      });

      const response = {
        orderId: updatedOrder.order.id,
        orderNo: order.orderNo,
        status: updatedOrder.order.status,
        paidAmount: updatedOrder.order.paidAmount,
        dueAmount: updatedOrder.order.dueAmount,
        paymentId: updatedOrder.payment.id,
      };

      if (idempotencyState?.mode === 'fresh') {
        await this.idempotency.complete(idempotencyState.keyId, 200, response);
      }

      await this.audit.log({
        tenantId,
        userId: user.userId,
        action: 'UPDATE',
        entity: 'ORDER_CHECKOUT',
        entityId: order.id,
        payload: {
          paidAmount: dto.amount,
          method: dto.method,
        },
      });

      this.realtime.emitTenant(tenantId, 'order:status-updated', {
        orderId: order.id,
        orderNo: order.orderNo,
        status: updatedOrder.order.status,
        dueAmount: updatedOrder.order.dueAmount,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      if (idempotencyState?.mode === 'fresh') {
        await this.idempotency.fail(idempotencyState.keyId);
      }
      throw error;
    }
  }

  async listOrders(user: AuthUserContext) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.order.findMany({
      where: { tenantId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return {
      success: true,
      data,
    };
  }

  async findOrder(user: AuthUserContext, orderId: string) {
    const tenantId = this.requireTenant(user);

    const data = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Order not found');
    }

    return {
      success: true,
      data,
    };
  }
}
