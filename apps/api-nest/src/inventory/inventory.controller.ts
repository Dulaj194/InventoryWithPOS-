import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ROLE_CODES } from '../auth/constants/roles';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('categories')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.CASHIER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  categories(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.listCategories(req.user);
  }

  @Post('categories')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  createCategory(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.inventoryService.createCategory(req.user, dto);
  }

  @Get('products')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.CASHIER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  products(
    @Req() req: AuthenticatedRequest,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.inventoryService.listProducts(req.user, lowStock === '1');
  }

  @Post('products')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  createProduct(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    return this.inventoryService.createProduct(req.user, dto);
  }

  @Get('suppliers')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  suppliers(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.listSuppliers(req.user);
  }

  @Post('suppliers')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  createSupplier(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.inventoryService.createSupplier(req.user, dto);
  }

  @Post('purchases')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  createPurchase(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.inventoryService.createPurchase(req.user, dto);
  }

  @Get('purchases')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  purchases(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.listPurchases(req.user);
  }

  @Get('stock-ledger')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  stockLedger(
    @Req() req: AuthenticatedRequest,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.stockLedger(req.user, productId);
  }

  @Get('products/barcode/:barcode')
  @Roles(
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.CASHIER,
    ROLE_CODES.INVENTORY_CLERK,
  )
  productsByBarcode(
    @Req() req: AuthenticatedRequest,
    @Param('barcode') barcode: string,
  ) {
    return this.inventoryService.getProductByBarcode(req.user, barcode);
  }
}
