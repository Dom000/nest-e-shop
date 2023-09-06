import {
  BadRequestException,
  ConflictException,
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';

@Injectable()
export class ResetPasswordMiddleware implements NestMiddleware {
  constructor(private prismaService: PrismaService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if (!req.query) {
      throw new BadRequestException('Not verified.');
    }
    const { token, id } = req.query;

    if (!token && !id) {
      throw new BadRequestException('Not verified.');
    }

    //checking if the id is a valid id
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id as string,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid user.');
    }

    //checking if the user has a reset token
    const userResetToken = await this.prismaService.resetPassword.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!userResetToken) {
      throw new NotFoundException('Non existent.');
    }

    //validate the reset token
    const validateToken = await argon.verify(
      userResetToken.resettoken,
      token as string,
    );

    if (!validateToken) {
      throw new ConflictException('Invalid.');
    }

    req.user = user;
    next();
  }
}
