import {
  MiddlewareConsumer,
  Module,
  NestMiddleware,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { authmail, authpass, service } from './constants/constants';
import { ResetPasswordMiddleware } from './auth/middleware/reset.password.middleware';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    ProductModule,
    PrismaModule,
    MailerModule.forRoot({
      transport: {
        service: service,
        auth: {
          user: authmail,
          pass: authpass,
        },
      },
    }),
    CloudinaryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResetPasswordMiddleware).forRoutes(
      {
        path: '/milesapi/auth/verify-resetlink',
        method: RequestMethod.GET,
      },
      {
        path: '/milesapi/auth/reset-password',
        method: RequestMethod.POST,
      },
    );
  }
}
