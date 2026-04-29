import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewSettingsRequestDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  reviewNotes?: string;
}

export { ReviewAction };
