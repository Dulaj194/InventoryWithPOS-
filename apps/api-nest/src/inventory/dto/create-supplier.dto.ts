import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @Length(2, 40)
  code: string;

  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  address?: string;
}
