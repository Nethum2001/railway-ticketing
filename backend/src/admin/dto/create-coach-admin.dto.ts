import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCoachAdminDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  baseFare!: number;

  @IsIn(['FIRST_CLASS', 'SECOND_CLASS'])
  travelClass!: 'FIRST_CLASS' | 'SECOND_CLASS';

  @IsOptional()
  @IsBoolean()
  hasBagRack?: boolean;

  @IsOptional()
  @IsBoolean()
  hasToilet?: boolean;
}
