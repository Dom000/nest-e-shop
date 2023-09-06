import { ConflictException, Injectable } from '@nestjs/common';
import { ProductImage, UserImage } from '@prisma/client';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class CloudinaryHelperService {
  constructor(private cloudinary: CloudinaryService) {}

  //deleting multiple images
  async deleteImages(images: Array<ProductImage>) {
    await Promise.all(
      images?.map(
        async (image: ProductImage) =>
          await this.cloudinary.handleDeleteImage(image.public_id),
      ),
    );
  }

  //uploading multiple images
  async uploadProductImages(files: Array<Express.Multer.File>, folder: string) {
    let productImages: Array<UploadApiResponse | UploadApiErrorResponse> = [];

    for (var i = 0; i < files.length; i++) {
      const newImage = files[i];

      const uploading = await this.cloudinary
        .handleUploadImage(newImage, folder)
        .then((result) => {
          return result;
        });
      productImages.push(uploading);
    }
    return Promise.all(productImages);
  }

  //delete an image
  async deleteImage(image: ProductImage | UserImage) {
    await this.cloudinary.handleDeleteImage(image.public_id);
  }

  //upload an image
  async uploadImage(file: Express.Multer.File, folder: string) {
    return await this.cloudinary
      .handleUploadImage(file, folder)
      .catch((error) => {
        return error;
      });
  }
}
