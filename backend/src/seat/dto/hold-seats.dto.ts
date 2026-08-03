import {
  IsArray,
  IsDateString,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class HoldSeatsDto {
  @IsString()
  holderKey!: string;

  @IsString()
  coachCode!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  seatNumbers!: string[];

  @IsString()
  originStation!: string;

  @IsString()
  destinationStation!: string;

  @IsDateString()
  journeyDate!: string;
}
