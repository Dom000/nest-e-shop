import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import slugify from 'slugify';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProductDto } from './dto/product.dto';
import { ProductHelperService } from './producthelper.service';
import {
  ProductDataTypes,
  ProductReviewTypes,
  UpdateProductDataTypes,
} from './typings.product';

//product selected details
export const productDetailsSelected = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  longDescription: true,
  price: true,
  actualPrice: true,
  discountPrice: true,
  quantity: true,
  category: true,
  rating: true,
  ratings: true,
  promoted: true,
  featured: true,
  creator_username: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class ProductService {
  constructor(
    private readonly prismaService: PrismaService,
    private cloudinaryHelper: CloudinaryHelperService,
    private productHelper: ProductHelperService,
  ) {}

  //create product
  async createProduct(
    files: Array<Express.Multer.File>,
    body: ProductDataTypes,
    username: string,
  ) {
    //generating the product slug
    const options = {
      replacement: '-',
      remove: /[*+~.()'"!:@]/g,
      lower: true,
      strict: false,
      locale: 'en',
      trim: true,
    };
    const productSlug = slugify(body.name, options);

    // checking for duplicate product slug

    const duplicateProduct = await this.prismaService.product.findUnique({
      where: {
        slug: productSlug,
      },
    });
    if (duplicateProduct) {
      throw new ConflictException('product already exists.');
    }

    //calculating the price
    let productPrice: number;

    if (body.discount === 0) {
      let newPrice = body.actualPrice;
      productPrice = newPrice;
    } else {
      let newPrice = body.actualPrice - body.discount;
      productPrice = newPrice;
    }

    if (files !== undefined) {
      if (files.length > 5) {
        throw new ConflictException('Images are more than 5.');
      }

      const newProduct = await this.prismaService.product.create({
        data: {
          name: body.name,
          slug: productSlug,
          shortDescription: body.shortDescription,
          longDescription: body.longDescription,
          price: productPrice,
          actualPrice: body.actualPrice,
          discountPrice: body.discount,
          quantity: body.quantity,
          category: body.category,
          promoted: body.promoted,
          featured: body.featured,
          creator_username: username,
        },
      });

      if (newProduct) {
        //uploading the images
        const uploadedImages = await this.cloudinaryHelper.uploadProductImages(
          files,
          'eshop-productImages',
        );

        const productImages = uploadedImages.map((image) => {
          return {
            productId: newProduct.id,
            public_id: image.public_id,
            url: image.secure_url,
            owner_username: username,
          };
        });

        await this.prismaService.productImage.createMany({
          data: productImages,
        });

        return {
          success: true,
          message: `The Product ${newProduct.name} Created Successfully.`,
        };
      }
    }
  }

  //get all products
  async getProducts() {
    const products = await this.prismaService.product.findMany({
      select: {
        ...productDetailsSelected,
        productImages: {
          select: {
            public_id: true,
            url: true,
            productId: true,
          },
        },
        reviews: {
          select: {
            id: true,
            productId: true,
            username: true,
            review: true,
            rate: true,
          },
        },
      },
    });

    if (products.length === 0) {
      throw new NotFoundException('No product available for now.');
    } else {
      return { success: true, products };
    }
  }

  //get a product by slug
  async getProduct(slug: string) {
    const product = await this.prismaService.product.findUnique({
      where: {
        slug: slug,
      },
      select: {
        ...productDetailsSelected,
        productImages: {
          select: {
            public_id: true,
            url: true,
            productId: true,
          },
        },
        reviews: {
          select: {
            id: true,
            productId: true,
            userId: true,
            username: true,
            review: true,
            rate: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found from get product');
    }

    return { success: true, product };
  }

  // delete a product
  async deleteProduct(slug: string, username: string) {
    //check if product exists
    const foundProduct = await this.prismaService.product.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!foundProduct) {
      throw new NotFoundException('Product not found.');
    }

    //checking if the user actually created the product
    if (foundProduct.creator_username !== username) {
      throw new UnauthorizedException('You are not authorized.');
    }

    //look for images related to product
    const images = await this.prismaService.productImage.findMany({
      where: {
        productId: foundProduct.id,
      },
    });

    if (images.length > 0) {
      //deleting the images in cloudinary
      await this.cloudinaryHelper.deleteImages(images);

      //deleting images in database
      // await this.prismaService.productImage.deleteMany({
      //   where: {
      //     productId: foundProduct.id,
      //   },
      // });
    }

    //look for product reviews
    // const productReviews = await this.prismaService.review.findMany({
    //   where: {
    //     productId: foundProduct.id,
    //   },
    // });

    // //deleting reviews from the database
    // if (productReviews.length > 0) {
    //   await this.prismaService.review.deleteMany({
    //     where: {
    //       productId: foundProduct.id,
    //     },
    //   });
    // }

    //delete the product
    await this.prismaService.product.delete({
      where: {
        id: foundProduct.id,
      },
    });

    return { success: true, message: 'Product deleted.' };
  }

  //delete an image from product images
  async deleteImage(id: string, username: string) {
    const foundImage = await this.prismaService.productImage.findUnique({
      where: {
        id: id,
      },
    });

    if (!foundImage) {
      throw new NotFoundException('Image does not exist.');
    }

    if (foundImage.owner_username !== username) {
      throw new UnauthorizedException('You are not authorized.');
    }

    //delete from cloudinary
    await this.cloudinaryHelper.deleteImage(foundImage);

    //delete from database
    await this.prismaService.productImage.delete({
      where: {
        id: foundImage.id,
      },
    });

    return { success: true, message: 'Image deleted.' };
  }

  // update product
  async updateProduct(
    files: Array<Express.Multer.File>,
    slug: string,
    body: UpdateProductDataTypes,
    username: string,
  ) {
    //check if this product exists
    const foundProduct = await this.prismaService.product.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!foundProduct) {
      throw new NotFoundException('Product not found.');
    }

    // include a check to query the database if username passed exixts

    //making sure it is the product owner who can update the product
    if (foundProduct.creator_username !== username) {
      throw new UnauthorizedException('Not authorized to update this product.');
    }

    //check for the number of already existing images
    const productImages = await this.prismaService.productImage.findMany({
      where: {
        productId: foundProduct.id,
      },
    });

    //checking if there are new image file/files to upload
    if (files !== undefined) {
      if (files !== undefined && productImages.length + files.length <= 5) {
        //uploading the images
        const uploadedImages = await this.cloudinaryHelper.uploadProductImages(
          files,
          'eshop-productImages',
        );

        const productImages = uploadedImages.map((image) => {
          return {
            productId: foundProduct.id,
            public_id: image.public_id,
            url: image.secure_url,
            owner_username: foundProduct.creator_username,
          };
        });

        await this.prismaService.productImage.createMany({
          data: productImages,
        });
      }

      if (files?.length + productImages?.length > 5) {
        throw new ConflictException('Too many images, only 5 images allowed.');
      }
    }

    let newSlug: string;
    let newPrice: number;

    //checking if there is a name value
    if (body.name) {
      //generating the product slug
      const options = {
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: false,
        locale: 'en',
        trim: true,
      };
      const productSlug = slugify(body.name, options);

      newSlug = productSlug;
    }

    //checking if there is actualprice /discount value
    if (body.actualPrice !== undefined && body.discount !== undefined) {
      let price = body.actualPrice - body.discount;
      newPrice = price;
    }
    if (body.actualPrice !== undefined && body.discount === 0) {
      let price = body.actualPrice - body.discount;
      newPrice = price;
    }
    if (body.actualPrice !== undefined && body.discount === undefined) {
      let price = body.actualPrice - foundProduct.discountPrice;
      newPrice = price;
    }
    if (body.actualPrice === undefined && body.discount !== undefined) {
      let price = foundProduct.actualPrice - body.discount;
      newPrice = price;
    }

    //update data object

    let updateObject = {
      name: body.name ? body.name : foundProduct.name,
      slug: body.name ? newSlug : foundProduct.slug,
      shortDescription: body.shortDescription
        ? body.shortDescription
        : foundProduct.shortDescription,
      longDescription: body.longDescription
        ? body.longDescription
        : foundProduct.longDescription,
      price:
        body.actualPrice | body.discount | (body.actualPrice && body.discount)
          ? newPrice
          : foundProduct.price,
      actualPrice: body.actualPrice
        ? body.actualPrice
        : foundProduct.actualPrice,
      discountPrice: body.discount ? body.discount : foundProduct.discountPrice,
      quantity: body.quantity ? body.quantity : foundProduct.quantity,
      category: body.category ? body.category : foundProduct.category,
      promoted: body.promoted ? body.promoted : foundProduct.promoted,
      featured: body.featured ? body.featured : foundProduct.featured,
    };

    //sending to the database
    await this.prismaService.product.update({
      where: {
        id: foundProduct.id,
      },
      data: updateObject,
    });

    return { success: true, message: 'Product updated.' };
  }

  //product review
  async productReview(
    slug: string,
    body: ProductReviewTypes,
    username: string,
  ) {
    // check if product exists
    const foundProduct = await this.prismaService.product.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!foundProduct) {
      throw new NotFoundException('Product not found.');
    }

    //checking if username is a valid user's username
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found.');
    }

    //fetching all reviews owned by the user
    const userReviewsProductIds = await this.prismaService.review.findMany({
      where: {
        username: username,
      },
      select: {
        productId: true,
      },
    });

    //checking if user has already reviewed this particular product
    const reviewExists = userReviewsProductIds.filter(
      (review) => review.productId === foundProduct.id,
    );

    if (reviewExists.length > 0) {
      throw new ConflictException('You already reviewed this product.');
    }

    // the review object
    const reviewObject = {
      productId: foundProduct.id,
      userId: foundUser.id,
      username: foundUser.username,
      review: body.review,
      rate: body.rate ? body.rate : 0,
    };
    //create the new review
    const newReview = await this.prismaService.review.create({
      data: reviewObject,
    });

    // updating the product rating
    await this.productHelper.productUpdating(newReview);

    // //get all the reviews now
    // const allReviews = await this.prismaService.review.findMany({
    //   where: {
    //     productId: foundProduct.id,
    //   },
    //   select: {
    //     productId: true,
    //     review: true,
    //     username: true,
    //     rate: true,
    //   },
    // });

    // // filter for 1,2,3,4,5, respective ratings
    // const oneStar = allReviews.filter((rating) => rating.rate === 1);
    // const twoStar = allReviews.filter((rating) => rating.rate === 2);
    // const threeStar = allReviews.filter((rating) => rating.rate === 3);
    // const fourStar = allReviews.filter((rating) => rating.rate === 4);
    // const fiveStar = allReviews.filter((rating) => rating.rate === 5);

    // //calculating the average rating of this product
    // const oneStarRating = 1 * oneStar.length;
    // const twoStarRating = 2 * twoStar.length;
    // const threeStarRating = 3 * threeStar.length;
    // const fourStarRating = 4 * fourStar.length;
    // const fiveStarRating = 5 * fiveStar.length;

    // //summing all ratings
    // const totalRating =
    //   oneStarRating +
    //   twoStarRating +
    //   threeStarRating +
    //   fourStarRating +
    //   fiveStarRating;

    // const averageRating = totalRating / allReviews.length;
    // const rating = Math.trunc(averageRating);

    // //update the product to include rating
    // await this.prismaService.product.update({
    //   where: {
    //     id: foundProduct.id,
    //   },
    //   data: {
    //     rating: rating,
    //     ratings: averageRating,
    //   },
    // });

    if (newReview) {
      return { success: true, message: 'Successful review.', newReview };
    } else {
      throw new BadRequestException('Review not successful.');
    }
  }

  //delete produc review
  async deleteReview(id: string, username: string) {
    //check if the review exists
    const foundReview = await this.prismaService.review.findUnique({
      where: {
        id: id,
      },
    });

    if (!foundReview) {
      throw new NotFoundException('Review not found.');
    }

    //getting the product
    const foundProduct = await this.prismaService.product.findUnique({
      where: {
        id: foundReview.productId,
      },
      select: {
        id: true,
      },
    });

    //check if the user deleting is the rightful owner of the review
    if (foundReview.username !== username) {
      throw new UnauthorizedException('Unauthorized to delete.');
    }

    //deleting the review
    await this.prismaService.review.delete({
      where: {
        id: foundReview.id,
      },
    });

    const prodId = { productId: foundProduct.id };

    // updating the product rating
    await this.productHelper.productUpdating(prodId);

    return { success: true, message: 'Review Deleted.' };
  }
}
