import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { ProductHelperService } from './producthelper.service';

@Module({
  imports: [CloudinaryModule, PrismaModule],
  controllers: [ProductController],
  providers: [ProductService, CloudinaryHelperService, ProductHelperService],
})
export class ProductModule {}
