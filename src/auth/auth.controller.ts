import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNotImplementedResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ExampleRefreshResponse,
  ExampleSignInResponse,
  ExampleSignUpResponse,
  ExampleVerifyEmailResponse,
  ForgotPasswordDto,
  OtpDto,
  PasswordChangeDto,
  PasswordResetDto,
  SignInDto,
  SignUpDto,
} from './dto/auth.dto';
import { JwtGuard } from './guard/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from './decorator/get.user.decorator';
import { User } from '@prisma/client';

@ApiTags('Authentication')
@Controller('/milesapi/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //register user controller
  @Post('/sign-up')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: ExampleSignUpResponse,
  })
  @ApiConflictResponse({
    description: 'Username or email already exists.',
  })
  @ApiNotImplementedResponse({
    description: 'User not registered',
  })
  @UseInterceptors(FileInterceptor('image'))
  signUp(@UploadedFile() file: Express.Multer.File, @Body() body: SignUpDto) {
    return this.authService.signUp(file, body);
  }

  //login user controller
  @Post('sign-in')
  @ApiCreatedResponse({
    description: 'User signed In and access token generated',
    type: ExampleSignInResponse,
  })
  @ApiNotFoundResponse({
    description: 'Invalid credentials',
  })
  @ApiConflictResponse({
    description: 'Invalid Credentials',
  })
  signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res) {
    return this.authService.signIn(body, res);
  }

  //refresh user access token
  @Get('/refresh-token')
  @ApiCreatedResponse({
    description: 'New access token generated',
    type: ExampleRefreshResponse,
  })
  @ApiConflictResponse({
    description: 'Invalid token',
  })
  @ApiNotFoundResponse({
    description: 'No credentials',
  })
  @ApiUnauthorizedResponse({
    description: 'Not Authorized',
  })
  refreshToken(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.refreshToken(req, res);
  }

  //verify email with otp
  @Post('/verify-email')
  @ApiCreatedResponse({
    description: 'Email verified successfully',
    type: ExampleVerifyEmailResponse,
  })
  @ApiConflictResponse({
    description: 'Invalid Otp',
  })
  @ApiNotFoundResponse({
    description: 'Not found',
  })
  verifyEmail(@Body() body: OtpDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('/sign-out')
  @ApiForbiddenResponse({
    description: 'When there is no cookie token, the request fails.',
  })
  signOut(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.signOut(req, res);
  }

  @Post('/forgot-password')
  @ApiNotFoundResponse({
    description: 'Not found',
  })
  @ApiConflictResponse({
    description: 'Reset Link Exists.',
  })
  @ApiCreatedResponse({
    description: 'Reset Link sent successfully',
  })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @UseGuards(JwtGuard)
  @Post('/request-verification')
  @ApiSecurity('JWT-auth')
  requestVerification(@GetUser() user: User) {
    return this.authService.requestVerification(user.username);
  }

  //verifying the reset token and user id
  @Get('/verify-resetlink')
  verifyResetLink(@Req() req: Request) {
    return this.authService.verifyResetLink(req);
  }

  //reset-password
  @Post('/reset-password')
  @ApiCreatedResponse({
    description: 'Password Reset',
    type: PasswordResetDto,
  })
  resetPassword(@Body() body: PasswordResetDto, @Req() req: Request) {
    return this.authService.resetPassword(req, body);
  }

  //change user password
  @UseGuards(JwtGuard)
  @Post('/change-password')
  @ApiSecurity('JWT-auth')
  @ApiCreatedResponse({
    description: 'Change Password.',
    type: PasswordChangeDto,
  })
  changePassword(@Body() body: PasswordChangeDto, @GetUser() user: User) {
    return this.authService.changePassword(body, user);
  }
}
