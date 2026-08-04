import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCoachAmenitiesDto {
  @IsOptional()
  @IsBoolean()
  hasBagRack?: boolean;

  @IsOptional()
  @IsBoolean()
  hasToilet?: boolean;
}
