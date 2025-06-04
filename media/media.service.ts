import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { JwtDecoded } from 'src/auth/jwt.strategy';
import { MediaType } from 'src/enums/media-type.enum';
import { S3Service } from 'src/services/s3.service';
import { Media, MediaDocument } from './media.schema';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private MediaModel: SoftDeleteModel<MediaDocument>,

    private s3Service: S3Service,
  ) {}

  async create(src: string, groupType: MediaType, user: JwtDecoded) {
    const image = new this.MediaModel({ src, groupType, user: user._id });
    await image.save();
    return image;
  }

  async createDummyImage(filePath: string) {
    const fs = require('fs');
    const path = require('path');

    // Read the file from the filesystem
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Create a mock Express.Multer.File object
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: fileName,
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: fileBuffer,
      size: fileBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const groupType = MediaType.PRODUCT;
    const url = await this.s3Service.uploadFile(mockFile, groupType);
    const image = new this.MediaModel({
      src: url,
      groupType: MediaType.PRODUCT,
    });
    await image.save();
    return image;
  }

  async deleteBySrc(src: string) {
    await this.s3Service.deleteImage(src);

    return await this.MediaModel.findOneAndDelete({ src });
  }

  async delete(id: string, user: JwtDecoded) {
    return await this.MediaModel.findByIdAndDelete(id);
  }
}
