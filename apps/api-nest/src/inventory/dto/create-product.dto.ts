import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(2, 50)
  sku: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  barcode?: string;

  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  unit?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
