import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModuleAsyncOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException, Logger } from '@nestjs/common';

const logger = new Logger('MulterAsyncConfig');

export const multerAsyncConfig: MulterModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    logger.log('--- Initializing Multer Configuration ---');
    try {
      // --- Xác định thư mục Upload Vật lý Cơ sở ---
      const uploadDirName = configService.get<string>('UPLOAD_DIR', 'uploads');
      const uploadDir = resolve(uploadDirName);
      logger.log(`Base upload directory resolved to: ${uploadDir}`);

      // --- Hàm tiện ích tạo thư mục ---
      const ensureDirExists = (dirPath: string) => {
        if (!existsSync(dirPath)) {
          logger.log(`Creating directory: ${dirPath}`);
          try {
            mkdirSync(dirPath, { recursive: true });
          } catch (mkdirError) {
            logger.error(`Failed to create directory ${dirPath}`, mkdirError.stack);
            throw new Error(`Could not create upload directory: ${mkdirError.message}`);
          }
        }
      };
      // Đảm bảo thư mục gốc tồn tại khi ứng dụng khởi động
      ensureDirExists(uploadDir);

      // --- Lấy cấu hình khác ---
      const maxFileSize = configService.get<number>('MAX_FILE_SIZE', 25 * 1024 * 1024); // 5MB
      const allowedMimeTypesStr = configService.get<string>(
        'ALLOWED_MIME_TYPES',
        'image/jpeg,image/png,image/jpg,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/x-flv', // Thêm video types nếu cần
      );
      const allowedMimeTypes = (allowedMimeTypesStr || '')
        .split(',')
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
      logger.log(`Max file size: ${maxFileSize} bytes`);
      logger.log(`Allowed MIME types: [${allowedMimeTypes.join(', ')}]`);


      // --- Tạo DiskStorage ---
      const storage = diskStorage({
        destination: (req, file, cb) => {
          let destinationSubDir = ''; // Thư mục con mặc định (nếu có)
          switch (file.fieldname) {
            case 'avatar': destinationSubDir = 'farm/farm-avatars'; break;
            case 'profile_images': destinationSubDir = 'farm/farm-profiles'; break;
            case 'cccd': destinationSubDir = 'farm/cccd'; break;
            case 'biometric_images': destinationSubDir = 'farm/biometric-images'; break;
            case 'biometric_video': destinationSubDir = 'farm/biometric-video'; break;
            case 'certificate_images': destinationSubDir = 'farm/farm-certificates'; break;
            case 'category_icon': destinationSubDir = 'category/icon'; break;
            case 'product_images': destinationSubDir = 'product/images'; break;
            case 'product_videos': destinationSubDir = 'product/videos'; break;
            case 'review_images': destinationSubDir = 'review/images'; break;
            case 'review_videos': destinationSubDir = 'review/videos'; break;
            case 'process_images': destinationSubDir = 'process/images'; break;
            case 'process_videos': destinationSubDir = 'process/videos'; break;
            default: logger.warn(`Unknown fieldname "${file.fieldname}" received by Multer destination`);
          }
          // Tạo đường dẫn tuyệt đối cuối cùng
          const finalDestination = join(uploadDir, destinationSubDir);
          ensureDirExists(finalDestination); // Đảm bảo thư mục con tồn tại
          logger.debug(`[Multer Destination] Field: ${file.fieldname} -> Path: ${finalDestination}`);
          cb(null, finalDestination); // Callback với đường dẫn vật lý tuyệt đối
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const originalName = file.originalname || 'unnamed_file';
          const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'tmp';
          const finalFilename = `${uniqueSuffix}.${fileExt}`;
          logger.debug(`[Multer Filename] Field: ${file.fieldname} -> Name: ${finalFilename}`);
          cb(null, finalFilename); // Callback với tên file duy nhất
        },
      });

      // --- Trả về Cấu hình Multer Hoàn chỉnh ---
      const multerOptions = {
        storage: storage, // Quan trọng: phải là diskStorage đã tạo
        limits: {
          fileSize: maxFileSize,
        },
        fileFilter: (req, file, cb) => {
          logger.debug(`[Multer FileFilter] Checking: ${file.originalname} (${file.mimetype})`);
          if (allowedMimeTypes.includes(file.mimetype)) {
            logger.debug(`[Multer FileFilter] Allowed: ${file.originalname}`);
            cb(null, true); // Chấp nhận
          } else {
            logger.warn(`[Multer FileFilter] Rejected: ${file.originalname} (Type ${file.mimetype} not allowed)`);
            cb(new BadRequestException(`Chỉ chấp nhận các định dạng: ${allowedMimeTypes.join(', ')}`), false); // Từ chối
          }
        },
      };
      logger.log('--- Multer Configuration Factory Finished Successfully ---');
      return multerOptions;

    } catch (error) {
      logger.error('--- !!! CRITICAL ERROR IN Multer Configuration Factory !!! ---', error.stack);
      // Ném lỗi để ngăn ứng dụng chạy với cấu hình sai
      throw new Error(`Failed to initialize Multer configuration: ${error.message}`);
    }
  },
};