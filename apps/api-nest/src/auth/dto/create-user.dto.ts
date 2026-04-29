import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { ROLE_CODES } from '../constants/roles';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  fullName: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsIn([
    ROLE_CODES.TENANT_ADMIN,
    ROLE_CODES.MANAGER,
    ROLE_CODES.CASHIER,
    ROLE_CODES.INVENTORY_CLERK,
  ])
  roleCode: string;

  @IsOptional()
  @IsString()
  outletId?: string;
}
