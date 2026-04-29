import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma';

export class CheckoutOrderDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNo?: string;
}
