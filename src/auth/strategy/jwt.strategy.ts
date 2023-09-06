import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwt_secret } from 'src/constants/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayloadType } from '../typings.auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt_secret,
    });
  }

  async validate(payload: JwtPayloadType) {
    //getting the details of the signed in user
    if (payload) {
      const user = await this.prisma.user?.findUnique({
        where: {
          username: payload.username,
        },
      });
      delete user.password;
      // return {username: payload.username, role: payload.role };
      return {
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
      };
    } else {
      throw new ForbiddenException('You cant do this.');
    }
  }
}
