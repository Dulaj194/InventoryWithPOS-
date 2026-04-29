import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateSettingsRequestDto {
  @IsOptional()
  @IsBoolean()
  enableInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  enablePos?: boolean;

  @IsOptional()
  @IsBoolean()
  enableReports?: boolean;

  @IsOptional()
  @IsBoolean()
  enableAccounting?: boolean;

  @IsOptional()
  @IsBoolean()
  enableKds?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  requestReason?: string;
}
