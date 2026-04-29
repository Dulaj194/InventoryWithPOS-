import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_CODES } from '../auth/constants/roles';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PosService } from './pos.service';

@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('orders')
  @Roles(ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER, ROLE_CODES.CASHIER)
  createOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.posService.createOrder(req.user, dto, idempotencyKey);
  }

  @Post('orders/:id/checkout')
  @Roles(ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER, ROLE_CODES.CASHIER)
  checkout(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CheckoutOrderDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.posService.checkoutOrder(req.user, id, dto, idempotencyKey);
  }

  @Get('orders')
  @Roles(ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER, ROLE_CODES.CASHIER)
  orders(@Req() req: AuthenticatedRequest) {
    return this.posService.listOrders(req.user);
  }

  @Get('orders/:id')
  @Roles(ROLE_CODES.TENANT_ADMIN, ROLE_CODES.MANAGER, ROLE_CODES.CASHIER)
  order(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.findOrder(req.user, id);
  }
}
