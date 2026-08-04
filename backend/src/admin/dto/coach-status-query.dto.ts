import { IsOptional, Matches } from 'class-validator';

export class CoachStatusQueryDto {
  @IsOptional()
  @Matches(/^\S+$/)
  trainNo?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  journeyDate?: string;
}
