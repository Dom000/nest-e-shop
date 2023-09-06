import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ProductHelperService } from 'src/product/producthelper.service';

@Module({
  imports: [PrismaModule, JwtModule, CloudinaryModule],
  providers: [UserService, CloudinaryHelperService, ProductHelperService],
  controllers: [UserController],
})
export class UserModule {}
