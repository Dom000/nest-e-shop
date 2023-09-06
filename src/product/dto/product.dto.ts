import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Product 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The short description of the product',
    example: 'short description of product 1',
  })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({
    description: 'The full description of the product',
    example: 'full description of product 1',
  })
  @IsString()
  @IsNotEmpty()
  longDescription: string;

  @ApiProperty({
    description: 'The product actualprice',
    example: 110,
  })
  @IsNumber()
  @IsNotEmpty()
  actualPrice: number;

  @ApiProperty({
    description: 'The product discount',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  discount: number;

  @ApiProperty({
    description: 'The product quantity',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity?: number;

  @ApiProperty({
    description: 'The product category',
    example: 'category-1',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'If the product is promoted or not.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  promoted?: boolean;

  @ApiProperty({
    description: 'If the product is featured or not.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Product 1',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({
    description: 'The short description of the product',
    example: 'short description of product 1',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shortDescription: string;

  @ApiProperty({
    description: 'The full description of the product',
    example: 'full description of product 1',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  longDescription: string;

  @ApiProperty({
    description: 'The product price',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'The product actualprice',
    example: 110,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  actualPrice: number;

  @ApiProperty({
    description: 'The product discount',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  discount: number;

  @ApiProperty({
    description: 'The product quantity',
    example: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'The product category',
    example: 'category-1',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  category: string;

  @ApiProperty({
    description: 'If the product is promoted or not.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  promoted?: boolean;

  @ApiProperty({
    description: 'If the product is featured or not.',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product creation success true or false.',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Product creation success message.',
    example: 'The <product name> created successfully.',
  })
  @IsString()
  message: string;
}

export class ExampleProductDto {
  @ApiProperty({
    description: 'The Id of the product',
    example: '******7e507d126816f2******',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Product 1',
  })
  name: string;

  @ApiProperty({
    description: 'The slug-name of the product',
    example: 'product-1',
  })
  slug: string;

  @ApiProperty({
    description: 'The short description of the product',
    example: 'short description of product 1',
  })
  shortDescription: string;

  @ApiProperty({
    description: 'The full description of the product',
    example: 'full description of product 1',
  })
  longDescription: string;

  @ApiProperty({
    description: 'The product price',
    example: 100,
  })
  price: number;

  @ApiProperty({
    description: 'The product actualprice',
    example: 110,
  })
  actualPrice: number;

  @ApiProperty({
    description: 'The product discount',
    example: 10,
  })
  discountPrice: number;

  @ApiProperty({
    description: 'The product quantity',
    example: 5,
  })
  quantity?: number;

  @ApiProperty({
    description: 'The product category',
    example: 'category-1',
  })
  category: string;

  @ApiProperty({
    description: 'The product rating',
    example: 55.69,
  })
  rating?: Decimal;

  @ApiProperty({
    description: 'If the product is promoted or not.',
    example: true,
  })
  promoted?: boolean;

  @ApiProperty({
    description: 'If the product is featured or not.',
    example: true,
  })
  featured?: boolean;

  @ApiProperty({
    description: 'The product creator',
    example: '<username>',
  })
  creator_username: string;

  @ApiProperty({
    description: 'The Date product was created.',
    example: '2022-12-28T22:49:09.178Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'The Date product was updated.',
    example: '2022-12-28T22:49:09.178Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'The product images.',
    example: [
      {
        public_id: 'product-images/s*********',
        url: 'https://res.cloudinary.com/dngmkhxvz/image/upload/v1672315830/********.jpg',
      },
    ],
  })
  productImages: [
    {
      public_id: string;
      url: string;
    },
  ];

  @ApiProperty({
    description: 'The product images.',
    example: [
      {
        id: '*******22a4db9913*****',
        productId: '*******22a4db9913*****',
        username: '<username',
        review: 'the review comment',
        rate: 3,
      },
    ],
  })
  reviews: [
    {
      id: string;
      productId: string;
      username: string;
      review: string;
      rate: number;
    },
  ];
}
export class ProductReviewDto {
  @ApiProperty({
    description: 'The users review comment.',
    example: 'users product review',
  })
  @IsString()
  @IsNotEmpty()
  review: string;

  @ApiProperty({
    description: 'The users product rating. Maximum of 5.',
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  rate: number;
}
