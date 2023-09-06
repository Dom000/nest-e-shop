import { ConflictException, Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductReviewTypes, UProductsType } from './typings.product';

@Injectable()
export class ProductHelperService {
  constructor(private readonly prismaService: PrismaService) {}

  async productUpdating(args: UProductsType | Review) {
    const allReviews = await this.prismaService.review.findMany({
      where: {
        productId: args.productId,
      },
      select: {
        productId: true,
        rate: true,
      },
    });

    //calculating the average reviews and updating the product database
    if (allReviews.length > 0) {
      const oneStar = allReviews.filter((rating) => rating.rate === 1);
      const twoStar = allReviews.filter((rating) => rating.rate === 2);
      const threeStar = allReviews.filter((rating) => rating.rate === 3);
      const fourStar = allReviews.filter((rating) => rating.rate === 4);
      const fiveStar = allReviews.filter((rating) => rating.rate === 5);

      //calculating the average rating of this product
      const oneStarRating = 1 * oneStar.length;
      const twoStarRating = 2 * twoStar.length;
      const threeStarRating = 3 * threeStar.length;
      const fourStarRating = 4 * fourStar.length;
      const fiveStarRating = 5 * fiveStar.length;

      //summing all ratings
      const totalRating =
        oneStarRating +
        twoStarRating +
        threeStarRating +
        fourStarRating +
        fiveStarRating;

      const averageRating = totalRating / allReviews.length;
      const rating = Math.trunc(averageRating);

      //update the product to include rating
      await this.prismaService.product.update({
        where: {
          id: args.productId,
        },
        data: {
          rating: rating,
          ratings: averageRating,
        },
      });
    } else {
      //update the product to make rating and ratings 0
      await this.prismaService.product.update({
        where: {
          id: args.productId,
        },
        data: {
          rating: 0,
          ratings: 0,
        },
      });
    }
  }

  //re-calculating the product reviews this user deleted when deleting self
  async updatingProducts(productIds: UProductsType[]) {
    if (productIds) {
      await Promise.all(
        productIds.map(async (productId) => {
          await this.productUpdating(productId);
        }),
      );
    }
  }
}
