import { Injectable } from '@nestjs/common';
import { jwt_secret, refresh_secret, variant } from 'src/constants/constants';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthHelperService {
  constructor(private jwt: JwtService) {}

  //generating otp for email verification
  async generateOTP() {
    let otp = '';
    for (let i = 0; i <= 5; i++) {
      const randomValue = Math.round(Math.random() * Number(variant));
      otp += randomValue;
    }
    return otp;
  }

  //creating random bytes
  async createRandomBytes() {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(37, (err, buff) => {
        if (err) {
          reject(err);
        } else {
          const token = buff.toString('hex');
          resolve(token);
        }
      });
    });
  }

  //email verification template
  async emailVerificationTemplate(code: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <style>
      .container {
        margin-left: auto;
        margin-right: auto;
        border-radius: 10px;
      }
  
      @media screen and (min-width: 480px) {
        .container {
          margin-top: 10px;
        }
  
      }
    </style>
      <title>Email Verification Request</title>
    </head>
    <body>
    <div>
    <h2 style="color:#3563E9;
      padding-top: 20px;
      text-align: center;
      font-size: 25px;
      font-weight: 600; white-space: nowrap;">Welcome To Miles Blog</h2>

    <div class="container">
      <div>
        <p style="font-size: 16px; color:#3563E9; padding:3px; text-align: center;">We're glad to have you on board.</p>
        <p style="font-size: 14px; color:#3563E9; text-align: center; font-weight: 600;">Use this code below to verify
          your email address. </p>
        <p style="font-weight:600; color:black; letter-spacing: 0.05em; font-size: 20px; text-align: center;">${code}
        </p>
        <P style="font-size: 14px; color:#3563E9; text-align: center;">Thank you for choosing Miles E-shop.</P>
      </div>
    </div>
  </div>
  </div>
    </body>
    
    </html>
 
 `;
  }

  //verification success templates
  async verificationSuccessTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <style>
      .container {
        margin-left: auto;
        margin-right: auto;
        border-radius: 10px;
      }
  
      @media screen and (min-width: 480px) {
        .container {
          margin-top: 10px;
        }
  
      }
    </style>
      <title>Verification Success</title>
    </head>
    <body>
    <div>
      <h2 style="color:#3563E9;
      padding-top: 20px;
      text-align: center;
      font-size: 25px;
      font-weight: 600; white-space: nowrap;">Welcome To Miles E-shop</h2>
      <div class="container">
        <div>
        <p style="font-weight: 600; font-size: 16px; color:#3563E9; padding:3px; text-align: center;">Your Email verification was SUCCESSFUL.</p>
        <div>
          <p style="font-size: 16px; color:#3563E9; text-align: center; font-weight: 600;">You can now explore <b>Miles E-shop</b>. </p>
          <P style="font-size: 14px; color:#3563E9; text-align: center;">Thank you for choosing Miles E-shop.</P>
        </div>
        
    </div>
    </div>
    </div>
    </body>
    
    </html>
 
 `;
  }

  //password reset template
  async passwordResetTemplate(link: string) {
    return `
    <!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <style>
    .container {
      margin-left: auto;
      margin-right: auto;
      border-radius: 10px;
    }

    @media screen and (min-width: 480px) {
      .container {
        margin-top: 10px;
      }

    }
  </style>
  <title>Reset Password Request</title>
</head>

<body>
  <div>
    <h2 style="color:#3563E9;
     padding-top: 20px;
     text-align: center;
     font-size: 25px;
     font-weight: 600; white-space: nowrap;">Welcome To Miles E-shop</h2>
    <div class="container">
      <div>
        <p style="font-weight: 600; font-size: 16px; color:#3563E9; padding:3px; text-align: center;">Click the reset
          button below to reset your password.</p>
        <div>
          <div style="display: flex; align-items: center; justify-content: center; padding: 0px 10px;">
            <button
              style="font-size: 16px; font-weight: 600; width: 100%; border-radius: 5px; outline: none; border: none; padding: 10px 0; ">
              <a href="${link}" style="color: #3563E9; letter-spacing: 0.1em;">Reset Password </a>
            </button>
          </div>
          <P style="font-size: 14px; color:#3563E9; text-align: center;">Thank you for choosing Miles E-shop.</P>
        </div>

      </div>
    </div>
    </div>
</body>


</html>
   
   `;
  }

  async signJwt(
    username: string,
    role: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      username,
      role,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '30m',
      secret: jwt_secret,
    });

    return { access_token: token };
  }

  //nest refresh token generation
  async signRefreshToken(args: { username: string }) {
    const payload = args;

    return this.jwt.signAsync(payload, {
      secret: refresh_secret,
      expiresIn: '7d',
    });
  }
}
