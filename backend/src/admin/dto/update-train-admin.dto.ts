import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RouteStopDto {
  @IsString()
  station!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time!: string;
}

class FarePerHopDto {
  @IsInt()
  @Min(1)
  FIRST_CLASS!: number;

  @IsInt()
  @Min(1)
  SECOND_CLASS!: number;
}

export class UpdateTrainAdminDto {
  @IsOptional()
  @IsString()
  trainName?: string;

  @IsOptional()
  @IsString()
  startingCity?: string;

  @IsOptional()
  @IsString()
  endingCity?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  departureTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  travelTime?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FarePerHopDto)
  farePerHop?: FarePerHopDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  routeStops?: RouteStopDto[];
}
