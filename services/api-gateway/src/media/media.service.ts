import { Injectable, Logger } from '@nestjs/common';
import { AzureBlobService } from '../services/azure-blob.service';
import { CreateMediaDto, MediaType } from './dto';
import { User } from '../common/interfaces/user.interface';

export interface MediaRecord {
  id: string;
  name?: string;
  src: string;
  groupType: MediaType;
  uploadedBy: {
    id: string;
    email: string;
  };
  uploadedAt: Date;
  contentType: string;
  size: number;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private azureBlobService: AzureBlobService) { }

  async uploadFile(
    file: Express.Multer.File,
    createMediaDto: CreateMediaDto,
    user: User,
  ): Promise<MediaRecord> {
    try {
      this.validateFile(file);

      const fileUrl = await this.azureBlobService.uploadFile(
        file,
        createMediaDto.groupType,
        createMediaDto.name,
      );

      // Create media record
      const mediaRecord: MediaRecord = {
        id: this.generateId(),
        name: createMediaDto.name || file.originalname,
        src: fileUrl,
        groupType: createMediaDto.groupType,
        uploadedBy: {
          id: user.id,
          email: user.email,
        },
        uploadedAt: new Date(),
        contentType: file.mimetype,
        size: file.size,
      };

      this.logger.log(`Media uploaded successfully: ${fileUrl}`);
      return mediaRecord;
    } catch (error) {
      this.logger.error(`Media upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileUrl: string, user: User): Promise<boolean> {
    try {
      const success = await this.azureBlobService.deleteFile(fileUrl);

      if (success) {
        this.logger.log(
          `Media deleted successfully: ${fileUrl} by user: ${user.email}`,
        );
      }

      return success;
    } catch (error) {
      this.logger.error(`Media deletion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFileInfo(fileUrl: string) {
    try {
      return await this.azureBlobService.getFileInfo(fileUrl);
    } catch (error) {
      this.logger.error(
        `Failed to get file info: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async listFiles(groupType: MediaType, prefix?: string) {
    try {
      return await this.azureBlobService.listFiles(groupType, prefix);
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
