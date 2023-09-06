import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ChangePasswordTypes,
  OtpTypes,
  SignInTypes,
  SignUpTypes,
} from './typings.auth';
import * as argon from 'argon2';
import { MailerService } from '@nestjs-modules/mailer';
import { authmail, refresh_secret } from 'src/constants/constants';
import { Request, Response } from 'express';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { AuthHelperService } from './authhelper.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwt: JwtService,
    private mailerService: MailerService,
    private cloudinaryHelper: CloudinaryHelperService,
    private authHelperService: AuthHelperService,
  ) {}

  //register user
  async signUp(file: Express.Multer.File, body: SignUpTypes) {
    //check if username exists
    const duplicateUsername = await this.prismaService.user.findUnique({
      where: {
        username: body.username,
      },
    });
    //check if email exists
    const duplicateEmail = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (duplicateUsername) {
      throw new ConflictException('Username already taken,try another.');
    }
    if (duplicateEmail) {
      throw new ConflictException('Email already exists.');
    }

    //encrypting the password
    const hashedPassword = await argon.hash(body.password);

    //generate OTP for verification
    const OTP = await this.authHelperService.generateOTP();

    //email template to send
    const verificationCode =
      await this.authHelperService.emailVerificationTemplate(OTP);

    //encrypting the OTP
    const hashedOtp = await argon.hash(OTP);

    if (file) {
      //uploading the image
      const uploadedImage = await this.cloudinaryHelper.uploadImage(
        file,
        'eshop-userImage',
      );

      const user = await this.prismaService.user.create({
        data: {
          name: body.name,
          username: body.username,
          email: body.email,
          profilePic: {
            create: {
              public_id: uploadedImage.public_id,
              url: uploadedImage.secure_url,
            },
          },
          password: hashedPassword,
        },
      });

      if (!user) {
        throw new NotImplementedException();
      }

      //creating the user OTP
      await this.prismaService.otp.create({
        data: {
          username: user.username,
          otp: hashedOtp,
        },
      });

      //sending otp to users email
      await this.mailerService.sendMail({
        from: authmail,
        to: user?.email,
        subject: 'Email verification OTP code',
        html: verificationCode,
      });

      return {
        success: true,
        message: `${user.username} registered successfully`,
      };
    } else {
      const user = await this.prismaService.user.create({
        data: {
          name: body.name,
          username: body.username,
          email: body.email,
          password: hashedPassword,
        },
      });

      if (!user) {
        throw new NotImplementedException(
          'Registeration not successful,try again.',
        );
      }

      //creating the user OTP in database
      await this.prismaService.otp.create({
        data: {
          username: user.username,
          otp: hashedOtp,
        },
      });

      //sending otp to users email
      await this.mailerService.sendMail({
        from: authmail,
        to: user?.email,
        subject: 'Email verification OTP code',
        html: verificationCode,
      });

      return {
        success: true,
        message: `${user.username} registered successfully`,
      };
    }
  }

  //login user
  async signIn(body: SignInTypes, res: Response) {
    //check is user exists
    const userFound = await this.prismaService.user.findUnique({
      where: {
        username: body.username,
      },
    });

    if (!userFound) {
      throw new NotFoundException('Invalid Credentials');
    }
    //compare passwords
    const verifyPassword = await argon.verify(
      userFound.password,
      body.password,
    );

    if (!verifyPassword) {
      throw new ConflictException('Invalid Credentials');
    }

    const accesstoken = await this.authHelperService.signJwt(
      userFound.username,
      userFound.role,
    );

    const refreshToken = await this.authHelperService.signRefreshToken({
      username: userFound.username,
    });

    if (!refreshToken) {
      throw new ForbiddenException();
    }

    //remember to include secure on deply
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return accesstoken;
  }

  //logout user
  async signOut(req: Request, res: Response) {
    const cookies = req.cookies;

    if (!cookies || !cookies.refresh_token) {
      throw new NotFoundException();
    }

    //remember to secure this in production
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'none',
    });

    return { success: true, message: 'Logged Out.' };
  }

  //refresh user access token
  async refreshToken(req: Request, res: Response) {
    const cookies = req.cookies;

    if (!cookies) {
      throw new UnauthorizedException();
    }

    const refreshtoken = cookies?.refresh_token;

    //verifying the refresh token
    const verifiedToken = await this.jwt.verify(refreshtoken, {
      secret: refresh_secret,
    });

    if (!verifiedToken) {
      throw new ConflictException('Invalid token');
    }

    //find user and reassign access token
    const userFound = await this.prismaService.user.findUnique({
      where: {
        username: verifiedToken.username,
      },
      select: {
        role: true,
        username: true,
      },
    });
    if (!userFound) {
      throw new NotFoundException();
    }

    //generating a new access token for the user

    const accesstoken = await this.authHelperService.signJwt(
      userFound.username,
      userFound.role,
    );

    return accesstoken;
  }

  //verify email with otp
  async verifyEmail(body: OtpTypes) {
    //check if user exists
    const checkUser = await this.prismaService.user.findUnique({
      where: {
        username: body.username,
      },
    });
    if (!checkUser) {
      throw new NotFoundException('Invalid credentials');
    }

    //checking for OTP
    const foundOtp = await this.prismaService.otp.findUnique({
      where: {
        username: checkUser?.username,
      },
    });
    if (!foundOtp) {
      throw new NotFoundException('OTP not found');
    }

    //validate otp
    const validOtp = await argon.verify(foundOtp.otp, body.otp);

    if (!validOtp) {
      throw new ConflictException('Invalid Otp');
    }

    //cross checking otp owner
    const user = await this.prismaService.user.findUnique({
      where: {
        username: foundOtp.username,
      },
    });

    if (!user) {
      throw new NotFoundException('Does not exist');
    }

    //email verification success template
    const verificationSuccess =
      await this.authHelperService.verificationSuccessTemplate();

    // update user verification
    if (validOtp) {
      await this.prismaService.user.update({
        where: {
          username: foundOtp.username,
        },
        data: {
          verified: true,
        },
      });
    }

    //delete otp after verification
    await this.prismaService.otp.delete({
      where: {
        id: foundOtp.id,
      },
    });

    //send a verification success mail
    await this.mailerService.sendMail({
      from: authmail,
      to: user?.email,
      subject: 'Email verification Success',
      html: verificationSuccess,
    });

    return { success: true, message: `${foundOtp.username} Email verified.` };
  }

  //forgot password
  async forgotPassword(body: { email: string }) {
    //checking if the email exists
    const emailExists = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!emailExists) {
      throw new NotFoundException();
    }

    //checking if reset token already exists
    const resetTokenExists = await this.prismaService.resetPassword.findUnique({
      where: {
        userId: emailExists.id,
      },
    });

    if (resetTokenExists) {
      throw new ConflictException(
        'You already have a reset token,check your mail.',
      );
    }

    // generating the token
    const generatedRandomBytes =
      await this.authHelperService.createRandomBytes();

    //hashed reset token
    const hashedResetToken = await argon.hash(generatedRandomBytes as any);

    //saving new reset token
    await this.prismaService.resetPassword.create({
      data: {
        userId: emailExists.id,
        resettoken: hashedResetToken,
      },
    });

    const passwordResetLink = `http://localhost:3000/auth/resetpassword?token=${generatedRandomBytes}&id=${emailExists.id}`;

    //password reset link template
    const passwordResetLinkTemplate =
      await this.authHelperService.passwordResetTemplate(passwordResetLink);

    //send a verification success mail
    await this.mailerService.sendMail({
      from: authmail,
      to: emailExists?.email,
      subject: 'Password Reset Link',
      html: passwordResetLinkTemplate,
    });

    return {
      success: true,
      message: `${emailExists.username}, your password reset link has been sent to your mail.`,
    };
  }

  //request verification
  async requestVerification(username: string) {
    //checking the user and getting details
    const userFound = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!userFound) {
      throw new NotFoundException('Invalid credetials');
    }

    //checking is user is already verified
    if (userFound.verified === true) {
      throw new ConflictException('Already verified.');
    }

    //check if the user already has a verification code.
    const verificationCheck = await this.prismaService.otp.findUnique({
      where: {
        username: userFound.username,
      },
    });

    if (verificationCheck) {
      throw new ConflictException('Valid OTP present.');
    }

    // if no verification code create new otp snd send to user email
    const newOtp = await this.authHelperService.generateOTP();

    //email template to send
    const verificationCode =
      await this.authHelperService.emailVerificationTemplate(newOtp);

    //encrypting the OTP
    const hashedOtp = await argon.hash(newOtp);

    //saving new opt for user
    await this.prismaService.otp.create({
      data: {
        username: userFound.username,
        otp: hashedOtp,
      },
    });

    //sending otp to users email
    await this.mailerService.sendMail({
      from: authmail,
      to: userFound?.email,
      subject: 'Email verification OTP code',
      html: verificationCode,
    });

    return {
      success: true,
      message: 'Verification code sent.',
    };
  }

  //verify the reset link
  async verifyResetLink(req: Request) {
    return { success: true, message: 'Authorization granted.' };
  }

  //reset password
  async resetPassword(req: Request, body: { password: string }) {
    //user that requested for password reset
    let userForReset = req.user as User;

    //checking if the chosen password is same as the previous password
    const samePassword = await argon.verify(
      userForReset.password,
      body.password,
    );

    if (samePassword) {
      throw new ConflictException(
        'Same password with previous, choose another',
      );
    }

    //encrypting the password
    const hashedPassword = await argon.hash(body.password);

    //updating the password
    await this.prismaService.user.update({
      where: {
        id: userForReset.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    //deleting the reset password token from database
    await this.prismaService.resetPassword.delete({
      where: {
        userId: userForReset.id,
      },
    });

    return { success: true, message: 'Password Reset Successful.' };
  }

  //change user password
  async changePassword(body: ChangePasswordTypes, user: User) {
    //find the user
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found.');
    }

    //check id the passed password is equal to the the users password
    const verifyPassword = await argon.verify(
      foundUser.password,
      body.password,
    );

    if (!verifyPassword) {
      throw new ConflictException('Wrong password.');
    }
    //if password is correct, give access to change

    //encryting the new password
    const hashedPassword = await argon.hash(body.newPassword);

    //updating the password
    await this.prismaService.user.update({
      where: {
        id: foundUser.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true, message: 'Password Change successful.' };
  }
}
