import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { User, UserType } from '@prisma/client';
import { GetUser } from '../auth/decorator/get.user.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import {
  ExampleProductDto,
  ProductDto,
  ProductResponseDto,
  ProductReviewDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductService } from './product.service';

@ApiTags('Product')
@Controller('/milesapi/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtGuard)
  @Post('/create-product')
  @ApiSecurity('JWT-auth')
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: ProductResponseDto,
  })
  @ApiConflictResponse({
    description: 'Productalready exists.',
  })
  @ApiForbiddenResponse({
    description: 'Only admin can create product.',
  })
  @UseInterceptors(FilesInterceptor('productImages'))
  createProduct(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: ProductDto,
    @GetUser() user: User,
  ) {
    if (user.role !== UserType.ADMIN) {
      throw new ForbiddenException('You are not an admin.');
    }

    return this.productService.createProduct(files, body, user.username);
  }

  //get all products
  @Get('/allproducts')
  @ApiCreatedResponse({
    description: 'All products',
    type: ExampleProductDto,
  })
  @ApiNotFoundResponse({
    description: 'No product available for now.',
  })
  getAllProducts() {
    return this.productService.getProducts();
  }

  //get a product
  @Get(':slug')
  @ApiNotFoundResponse({
    description: 'Product not found.',
  })
  getProduct(@Param('slug') slug: string) {
    // return this.productService.getProduct(slug);
  }

  //delete a product
  @UseGuards(JwtGuard)
  @Delete('/delete/:slug')
  @ApiSecurity('JWT-auth')
  @ApiNotFoundResponse({
    description: 'Product not found.',
  })
  deleteProduct(@Param('slug') slug: string, @GetUser() user: User) {
    if (user.role !== UserType.ADMIN) {
      throw new ForbiddenException('You are not an admin');
    }

    return this.productService.deleteProduct(slug, user.username);
  }

  //delete an image from product images
  @UseGuards(JwtGuard)
  @Delete('/delete-image/:id')
  @ApiSecurity('JWT-auth')
  @ApiNotFoundResponse({
    description: 'Image not found.',
  })
  deleteImage(@Param('id') id: string, @GetUser() user: User) {
    if (user.role !== UserType.ADMIN) {
      throw new ForbiddenException('You are not an admin');
    }
    return this.productService.deleteImage(id, user.username);
  }

  //update product
  @UseGuards(JwtGuard)
  @Patch('/update/:slug')
  @ApiSecurity('JWT-auth')
  @UseInterceptors(FilesInterceptor('productImages'))
  updateProduct(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('slug') slug: string,
    @Body() body: UpdateProductDto,
    @GetUser() user: User,
  ) {
    if (user.role !== UserType.ADMIN) {
      throw new ForbiddenException('You are not an admin');
    }
    return this.productService.updateProduct(files, slug, body, user.username);
  }

  //customers review on a product
  @UseGuards(JwtGuard)
  @Post(':slug/product-review')
  @ApiSecurity('JWT-auth')
  productReview(
    @Param('slug') slug: string,
    @Body() body: ProductReviewDto,
    @GetUser() user: User,
  ) {
    return this.productService.productReview(slug, body, user.username);
  }

  //To do : dont forget to add authentication guard and logged in users username
  //deleting a product review
  @UseGuards(JwtGuard)
  @Delete(':id/delete-review')
  @ApiSecurity('JWT-auth')
  deleteReview(@Param('id') id: string, @GetUser() user: User) {
    return this.productService.deleteReview(id, user.username);
  }
}
