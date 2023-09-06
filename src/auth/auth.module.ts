import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { AuthHelperService } from './authhelper.service';
import { ResetPasswordMiddleware } from './middleware/reset.password.middleware';

@Module({
  imports: [PrismaModule, JwtModule, CloudinaryModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    CloudinaryHelperService,
    AuthHelperService,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ResetPasswordMiddleware)
      .forRoutes({ path: '/auth/verify-resetlink', method: RequestMethod.GET });
  }
}
