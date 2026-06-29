import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsIn(['ADMIN', 'DRIVER', 'CUSTOMER'])
  role: string;
}
