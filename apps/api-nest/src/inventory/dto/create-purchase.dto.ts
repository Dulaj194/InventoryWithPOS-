import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

class PurchaseItemInputDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseDto {
  @IsString()
  outletId: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  invoiceNo?: string;

  @IsDateString()
  purchaseDate: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemInputDto)
  items: PurchaseItemInputDto[];
}
