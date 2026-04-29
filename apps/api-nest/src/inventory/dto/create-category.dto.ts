import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  description?: string;
}
