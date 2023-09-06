import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserType } from '@prisma/client';
import { CloudinaryHelperService } from 'src/cloudinary/cloudinaryhelper.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductHelperService } from 'src/product/producthelper.service';
import { UProductsType } from 'src/product/typings.product';
import { isErrored } from 'stream';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private cloudinaryHelper: CloudinaryHelperService,
    private productHelper: ProductHelperService,
  ) {}

  //get users
  async getUsers() {
    const users = await this.prismaService.user.findMany({
      select: {
        name: true,
        username: true,
        email: true,
        profilePic: {
          select: {
            public_id: true,
            url: true,
          },
        },
        role: true,
        verified: true,
      },
    });

    if (!users) {
      throw new NotFoundException('No users at the moment.');
    }

    return { success: true, users };
  }

  //get user by username
  async getUser(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
      select: {
        name: true,
        username: true,
        email: true,
        profilePic: {
          select: {
            public_id: true,
            url: true,
          },
        },
        role: true,
        verified: true,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return { success: true, user };
  }

  //update user
  async updateUser(
    file: Express.Multer.File,
    body: { name?: string },
    user: User,
    username: string,
  ) {
    //check if user exists
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        profilePic: {
          select: {
            public_id: true,
            url: true,
          },
        },
        role: true,
        verified: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found.');
    }

    //check if the user is the same as the signed in user
    if (user.username === username) {
      //checking if there is a file and if user already has a profile picture

      if (file !== undefined) {
        // only owner can update image
        if (foundUser.profilePic !== null) {
          //finding the image
          const foundImage = await this.prismaService.userImage.findUnique({
            where: {
              public_id: foundUser.profilePic.public_id,
            },
          });
          if (foundImage) {
            //delete the previous image from cloudinary
            await this.cloudinaryHelper.deleteImage(foundImage);
            //delete the image from the database
            await this.prismaService.userImage.delete({
              where: {
                id: foundImage.id,
              },
            });
          }

          //upload the new image to cloudinary
          const uploadedImage = await this.cloudinaryHelper.uploadImage(
            file,
            'eshop-userImage',
          );

          //creating a new profile picture for the user
          await this.prismaService.userImage.create({
            data: {
              public_id: uploadedImage.public_id,
              url: uploadedImage.secure_url,
              userId: foundUser.id,
            },
          });
        }

        if (foundUser.profilePic === null) {
          //upload the new image to cloudinary
          const uploadedImage = await this.cloudinaryHelper.uploadImage(
            file,
            'eshop-userImage',
          );

          //creating a new profile picture for the user
          await this.prismaService.userImage.create({
            data: {
              public_id: uploadedImage.public_id,
              url: uploadedImage.secure_url,
              userId: foundUser.id,
            },
          });
        }
      }

      let updateUserObject = {
        name: body.name ? body.name : foundUser.name,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        verified: foundUser.verified,
      };

      //updating the user in the database
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: updateUserObject,
      });
      return { success: true, message: 'User updated.' };
    } else if (user.role === UserType.ADMIN) {
      let updateUserObject = {
        name: body.name ? body.name : foundUser.name,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        verified: foundUser.verified,
      };

      //updating the user in the database
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: updateUserObject,
      });
      return { success: true, message: 'User updated by admin.' };
    } else {
      throw new UnauthorizedException(
        'You are not authorized to update this user.',
      );
    }
  }

  //delete user
  async deleteUser(username: string, user: User) {
    //check if there is a user with this username
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        profilePic: {
          select: {
            public_id: true,
            url: true,
          },
        },
        role: true,
        verified: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('User not found.');
    }

    if (user.username === username) {
      //check if the user has an image, if true dlete from clodinary and database respectively
      if (foundUser.profilePic !== null) {
        //finding the image
        const foundImage = await this.prismaService.userImage.findUnique({
          where: {
            public_id: foundUser.profilePic.public_id,
          },
        });

        if (foundImage) {
          await this.cloudinaryHelper.deleteImage(foundImage);
        }
      }

      // getting the user reviews:
      const userReviews = await this.prismaService.review.findMany({
        where: {
          username: foundUser.username,
        },
        select: {
          productId: true,
        },
      });

      // updating the product rating
      await this.productHelper.updatingProducts(userReviews);

      //deleting the user
      await this.prismaService.user.delete({
        where: {
          id: foundUser.id,
        },
      });

      return { success: true, meesage: 'User deleted.' };
    }

    if (user.role === UserType.ADMIN) {
      //check if the user has an image, if true dlete from clodinary and database respectively
      if (foundUser.profilePic !== null) {
        //finding the image
        const foundImage = await this.prismaService.userImage.findUnique({
          where: {
            public_id: foundUser.profilePic.public_id,
          },
        });

        if (foundImage) {
          await this.cloudinaryHelper.deleteImage(foundImage);
        }
      }

      // getting the user reviews:
      const userReviews = await this.prismaService.review.findMany({
        where: {
          username: foundUser.username,
        },
        select: {
          productId: true,
        },
      });

      //updating the product
      await this.productHelper.updatingProducts(userReviews);

      //deleting the user
      await this.prismaService.user.delete({
        where: {
          id: foundUser.id,
        },
      });

      return { success: true, meesage: 'User deleted by Admin.' };
    }
  }
}
