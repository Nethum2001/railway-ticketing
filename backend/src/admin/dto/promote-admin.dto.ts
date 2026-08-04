import { IsEmail } from 'class-validator';

export class PromoteAdminDto {
  @IsEmail()
  email!: string;
}
