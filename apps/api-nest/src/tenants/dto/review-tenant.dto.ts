import { IsOptional, IsString, Length } from 'class-validator';

export class ReviewTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  notes?: string;
}
