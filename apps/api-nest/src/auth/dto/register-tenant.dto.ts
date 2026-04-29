import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  tenantCode: string;

  @IsEmail()
  businessEmail: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  businessPhone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  adminPassword: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  outletName?: string;
}
