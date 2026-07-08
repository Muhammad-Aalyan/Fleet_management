import { IsEmail, IsString, MinLength, IsIn, IsInt, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class VerifyOtpDto {
  @IsInt()
  userId: number;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResendOtpDto {
  @IsInt()
  userId: number;
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

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyResetOtpDto {
  @IsInt()
  userId: number;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class ResetPasswordDto {
  @IsInt()
  userId: number;

  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
