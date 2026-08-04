import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  trainNo?: string;

  @IsString()
  coachCode!: string;

  @IsString()
  seatNumber!: string;

  @IsString()
  originStation!: string;

  @IsString()
  destinationStation!: string;

  @IsDateString()
  journeyDate!: string;

  @IsString()
  @MinLength(2)
  passengerName!: string;

  @IsString()
  passengerNic!: string;

  @IsString()
  passengerPhone!: string;

  @IsIn(['FIRST_CLASS', 'SECOND_CLASS', 'THIRD_CLASS'])
  travelClass!: 'FIRST_CLASS' | 'SECOND_CLASS' | 'THIRD_CLASS';

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  holdToken?: string;
}
