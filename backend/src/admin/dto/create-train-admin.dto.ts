import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RouteStopDto {
  @IsString()
  @IsNotEmpty()
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

export class CreateTrainAdminDto {
  @IsString()
  @IsNotEmpty()
  trainNo!: string;

  @IsString()
  @IsNotEmpty()
  trainName!: string;

  @IsString()
  @IsNotEmpty()
  startingCity!: string;

  @IsString()
  @IsNotEmpty()
  endingCity!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  departureTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  arrivalTime!: string;

  @IsString()
  @IsNotEmpty()
  travelTime!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @ValidateNested()
  @Type(() => FarePerHopDto)
  farePerHop!: FarePerHopDto;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  routeStops!: RouteStopDto[];
}
