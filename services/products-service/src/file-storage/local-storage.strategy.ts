import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { IStorageStrategy, SavedFileResult } from './storage.strategy.interface';
import { FileType } from './file-storage.types';

@Injectable()
export class LocalStorageStrategy implements IStorageStrategy {
    private readonly logger = new Logger(LocalStorageStrategy.name);
    private readonly baseUploadPath: string; // Đường dẫn vật lý tuyệt đối
    private readonly baseUrl: string;      // Phần đầu URL công khai

    constructor(private readonly configService: ConfigService) {
        const uploadsDirectoryName = this.configService.get<string>('UPLOAD_DIR', 'uploads'); // Mặc định vào uploads
        this.baseUploadPath = path.resolve(process.cwd(), uploadsDirectoryName);

        this.baseUrl = this.configService.get<string>('FILE_BASE_URL', '/uploads'); // Khớp với UPLOAD_DIR
        if (this.baseUrl.endsWith('/')) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }

        this.logger.log(`(Local Strategy) Base upload path: ${this.baseUploadPath}`);
        this.logger.log(`(Local Strategy) Base URL: ${this.baseUrl}`);

        if (!existsSync(this.baseUploadPath)) {
            mkdirSync(this.baseUploadPath, { recursive: true });
            this.logger.log(`(Local Strategy) Created base upload directory: ${this.baseUploadPath}`);
        }
    }

    // --- Helper: Lấy thư mục đích ---
    private getDestinationDirectory(type: FileType): string {
        let destination = this.baseUploadPath;
        switch (type) {
            case 'product_images': destination = path.join(this.baseUploadPath, 'product', 'images'); break;
            case 'product_videos': destination = path.join(this.baseUploadPath, 'product', 'videos'); break;
            case 'farm_avatar': destination = path.join(this.baseUploadPath, 'farm', 'farm-avatars'); break;
            case 'farm_profile': destination = path.join(this.baseUploadPath, 'farm', 'farm-profiles'); break;
            case 'cccd': destination = path.join(this.baseUploadPath, 'farm', 'cccd'); break;
            case 'biometric_images': destination = path.join(this.baseUploadPath, 'farm', 'biometric-images'); break;
            case 'biometric_video': destination = path.join(this.baseUploadPath, 'farm', 'biometric-video'); break;
            case 'farm_certificate': destination = path.join(this.baseUploadPath, 'farm', 'farm-certificates'); break;
            case 'category_icon': destination = path.join(this.baseUploadPath, 'category', 'icon'); break;
            case 'review_images': destination = path.join(this.baseUploadPath, 'review', 'images'); break;
            case 'review_videos': destination = path.join(this.baseUploadPath, 'review', 'videos'); break;
            case 'process_images': destination = path.join(this.baseUploadPath, 'process', 'imges'); break;
            case 'process_videos': destination = path.join(this.baseUploadPath, 'process', 'videos'); break;
            default: this.logger.warn(`(Local getDestinationDirectory) Unknown type: ${type}`);
        }
        return destination;
    }

    // --- Helper: Tạo tên file duy nhất ---
    private generateUniqueFilename(originalName: string): string {
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(originalName);
        const baseFilename = path.basename(originalName, fileExtension);
        const sanitizedBaseFilename = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${sanitizedBaseFilename}-${uniqueSuffix}${fileExtension}`;
    }

    // --- Helper: Lấy đường dẫn tuyệt đối từ URL ---
    private getAbsolutePathFromUrl(url: string): string | null {
        const trimmedUrl = url?.trim();
        if (!trimmedUrl || !trimmedUrl.startsWith(this.baseUrl)) { return null; }
        let filePathFragment = trimmedUrl.substring(this.baseUrl.length);
        if (filePathFragment.startsWith('/') || filePathFragment.startsWith('\\')) {
            filePathFragment = filePathFragment.substring(1);
        }
        try { filePathFragment = decodeURIComponent(filePathFragment); } catch (e) { /* Ignore */ }
        return path.join(this.baseUploadPath, filePathFragment);
    }

    // --- Implement saveFiles ---
    async saveFiles(temporaryFiles: Express.Multer.File[], type: FileType): Promise<SavedFileResult[]> {
        if (!temporaryFiles || temporaryFiles.length === 0) { return []; }

        const absoluteDestinationDir = this.getDestinationDirectory(type);
        const results: SavedFileResult[] = [];
        const successfullyMovedFilesPaths: string[] = [];

        try {
            await fs.mkdir(absoluteDestinationDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                this.logger.error(`(Local saveFiles) Error creating dir ${absoluteDestinationDir}: ${error.message}`);
                throw new InternalServerErrorException(`Cannot create storage directory for ${type}`);
            }
        }

        for (const tempFile of temporaryFiles) {
            if (!tempFile || !tempFile.path || !tempFile.originalname) {
                this.logger.error('(Local saveFiles) Invalid file object!', { tempFile });
                await this.deleteByIdentifiers(successfullyMovedFilesPaths); // Rollback đã di chuyển
                throw new InternalServerErrorException(`Invalid file object: ${tempFile?.originalname}`);
            }

            const finalFilename = this.generateUniqueFilename(tempFile.originalname);
            const finalAbsolutePath = path.join(absoluteDestinationDir, finalFilename);

            try {
                await fs.rename(tempFile.path, finalAbsolutePath);

                const relativePathFragment = path.relative(this.baseUploadPath, finalAbsolutePath);
                const urlPath = relativePathFragment.replace(/\\/g, '/');
                const finalUrl = `${this.baseUrl}/${urlPath}`;

                results.push({
                    url: finalUrl,
                    identifier: finalAbsolutePath,
                    storageType: 'local',
                    originalName: tempFile.originalname,
                });
                successfullyMovedFilesPaths.push(finalAbsolutePath);
                this.logger.log(`(Local saveFiles) Saved: ${tempFile.originalname} -> ${finalAbsolutePath} | URL: ${finalUrl}`);
            } catch (moveError) {
                this.logger.error(`(Local saveFiles) Error moving ${tempFile.originalname} to ${finalAbsolutePath}: ${moveError.message}`, moveError.stack);
                await this.deleteByIdentifiers(successfullyMovedFilesPaths); // Rollback đã di chuyển
                try { await fs.unlink(tempFile.path); } catch (e) { } // Cố xóa file tạm
                throw new InternalServerErrorException(`Failed to save file "${tempFile.originalname}"`);
            }
        }
        return results;
    }

    // --- Implement deleteByIdentifiers ---
    async deleteByIdentifiers(absoluteFilePaths: string[]): Promise<void> {
        if (!absoluteFilePaths || absoluteFilePaths.length === 0) { return; }
        this.logger.log(`(Local deleteByIdentifiers) Deleting ${absoluteFilePaths.length} files by path...`);
        const deletionPromises = absoluteFilePaths.map((filePath) => {
            const trimmedPath = filePath?.trim();
            if (!trimmedPath) return Promise.resolve();
            return fs.unlink(trimmedPath).catch((error) => {
                if (error.code !== 'ENOENT') { // Chỉ log lỗi khác ENOENT
                    this.logger.error(`(Local deleteByIdentifiers) Error deleting "${trimmedPath}": ${error.message}`);
                } else {
                    this.logger.warn(`(Local deleteByIdentifiers) File not found (ENOENT): ${trimmedPath}`);
                }
            });
        });
        await Promise.all(deletionPromises);
        this.logger.log(`(Local deleteByIdentifiers) Finished path deletions.`);
    }

    // --- Implement deleteByUrls ---
    async deleteByUrls(urls: string[]): Promise<void> {
        if (!urls || urls.length === 0) { return; }
        this.logger.log(`(Local deleteByUrls) Deleting ${urls.length} files by URL...`);
        const pathsToDelete = urls
            .map(url => this.getAbsolutePathFromUrl(url)) // Chuyển URL thành path
            .filter((p): p is string => !!p);          // Lọc ra các path hợp lệ

        if (pathsToDelete.length > 0) {
            await this.deleteByIdentifiers(pathsToDelete); // Gọi hàm xóa theo path
        } else {
            this.logger.log(`(Local deleteByUrls) No valid paths derived from URLs.`);
        }
        this.logger.log(`(Local deleteByUrls) Finished URL deletions.`);
    }
}