import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'Miles Ryker',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'miles',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'miles@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user.It will be hashed',
    example: '12wezru345',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @ApiProperty({
    description: 'Is user verified true or false',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  verfied: boolean;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
  })
  @IsString()
  @IsOptional()
  role: string;
}

export class SignInDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'miles',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The password of the user.It will be hashed',
    example: '12wezru345',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
}

export class OtpDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'miles',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The OTP code sent to email',
    example: '223125',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @ApiProperty({
    description: 'Users email',
    example: 'mi****ke@gmail.com',
  })
  email: string;
}

export class RequestVerificationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Enter user username',
    example: 'mike',
  })
  username: string;
}

export class ExampleSignUpResponse {
  @ApiProperty({
    description: 'Resistration success true or false.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  success: boolean;

  @ApiProperty({
    description: 'Registration success message.',
    example: '<username> registered successfully',
  })
  @IsString()
  message: string;
}
export class ExampleSignInResponse {
  @ApiProperty({
    description: 'Registration success message.',
    example: 'xxxxxxxxxxxxxxxxxxxx',
  })
  @IsObject({})
  assess_token: {};
}

export class ExampleRefreshResponse {
  @ApiProperty({
    description: 'Registration success message.',
    example: 'xxxxxxxxxxxxxxxxxxxx',
  })
  @IsObject({})
  assess_token: {};
}

export class ExampleVerifyEmailResponse {
  @ApiProperty({
    description: 'Verification success true or false.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  success: boolean;

  @ApiProperty({
    description: 'Verification success message.',
    example: '<username>  Email verified',
  })
  @IsString()
  message: string;
}

export class PasswordResetDto {
  @ApiProperty({
    description: 'New user password.',
    example: '<user new password>',
  })
  @IsString()
  password: string;
}

export class PasswordChangeDto {
  @ApiProperty({
    description: 'User current password.',
    example: '<user current password>',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'User new password.',
    example: '<user new password>',
  })
  @IsString()
  newPassword: string;
}
