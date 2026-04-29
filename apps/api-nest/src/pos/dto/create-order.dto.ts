import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CreateOrderDto {
  @IsString()
  outletId: string;

  @IsOptional()
  @IsString()
  terminalId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
