import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient, BlockBlobClient, RestError } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises'; // Để đọc file tạm nếu Multer lưu vào disk
import { Readable } from 'stream';

import { IStorageStrategy, SavedFileResult } from './storage.strategy.interface';
import { FileType } from './file-storage.types';

@Injectable()
export class AzureBlobStorageStrategy implements IStorageStrategy {
    private readonly logger = new Logger(AzureBlobStorageStrategy.name);
    private readonly blobServiceClient: BlobServiceClient;
    private readonly containerClient: ContainerClient;
    private readonly containerName: string;
    private readonly publicBaseUrl: string; // URL công khai của container

    constructor(private readonly configService: ConfigService) {
        const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
        this.containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME', ''); // Mặc định là 'uploads'
        

        if (!connectionString || !this.containerName) {
            this.logger.error('(Azure Strategy) Missing Azure Storage configuration: ConnectionString or ContainerName.');
            throw new Error('Azure Storage configuration is missing.');
        }

        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);

        // Xác định publicBaseUrl
        const explicitBaseUrl = this.configService.get<string>('AZURE_STORAGE_PUBLIC_BASE_URL');
        if (explicitBaseUrl) {
            this.publicBaseUrl = explicitBaseUrl.endsWith('/') ? explicitBaseUrl.slice(0, -1) : explicitBaseUrl;
        } else {
            // Mặc định là URL của Azure Blob Storage
            const accountName = this.getAccountNameFromConnectionString(connectionString);
            if (!accountName) {
                throw new Error('Could not determine account name from connection string for public URL.');
            }
            this.publicBaseUrl = `https://${accountName}.blob.core.windows.net/${this.containerName}`;
        }

        this.logger.log(`(Azure Strategy) Initialized. Container: ${this.containerName}, Public Base URL: ${this.publicBaseUrl}`);
        this.ensureContainerExists();
    }

    private getAccountNameFromConnectionString(connectionString: string): string | null {
        const match = connectionString.match(/AccountName=([^;]+)/);
        return match ? match[1] : null;
    }

    private async ensureContainerExists(): Promise<void> {
        try {
            const exists = await this.containerClient.exists();
            if (!exists) {
                this.logger.log(`(Azure Strategy) Container "${this.containerName}" does not exist. Creating...`);
                // Cấu hình publicAccess có thể là 'blob' hoặc 'container' nếu bạn muốn file public
                // Mặc định là private. Nếu private, bạn cần tạo SAS token để truy cập.
                // Để đơn giản, giả sử container đã được tạo với quyền truy cập public 'blob' trên Portal.
                // Hoặc bạn có thể tạo với quyền truy cập cụ thể:
                // await this.containerClient.create({ access: 'blob' }); 
                await this.containerClient.createIfNotExists({ access: 'blob' }); // Nên set 'blob' để URL trực tiếp hoạt động
                this.logger.log(`(Azure Strategy) Container "${this.containerName}" created or already exists.`);
            }
        } catch (error) {
            this.logger.error(`(Azure Strategy) Error ensuring container "${this.containerName}" exists: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Failed to ensure Azure container "${this.containerName}" exists.`);
        }
    }

    private getBlobPathPrefix(type: FileType): string {
        switch (type) {
            case 'product_images': return 'product/images';
            case 'product_videos': return 'product/videos';
            case 'farm_avatar': return 'farm/farm-avatars';
            case 'farm_profile': return 'farm/farm-profiles';
            case 'cccd': return 'farm/cccd';
            case 'biometric_images': return 'farm/biometric-images';
            case 'biometric_video': return 'farm/biometric-video';
            case 'farm_certificate': return 'farm/farm-certificates';
            case 'category_icon': return 'category/icon';
            default:
                this.logger.warn(`(Azure getBlobPathPrefix) Unknown type: ${type}, using root.`);
                return ''; // Hoặc ném lỗi nếu type không xác định là không chấp nhận được
        }
    }

    private generateUniqueBlobName(originalName: string, prefix: string): string {
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(originalName);
        const baseFilename = path.basename(originalName, fileExtension);
        const sanitizedBaseFilename = baseFilename.replace(/[^a-zA-Z0-9_.-]/g, '_'); // Cho phép dấu chấm và gạch ngang
        const blobName = `${sanitizedBaseFilename}-${uniqueSuffix}${fileExtension}`;
        return prefix ? `${prefix}/${blobName}` : blobName;
    }

    private getBlobNameFromUrl(url: string): string | null {
        const trimmedUrl = url?.trim();
        if (!trimmedUrl || !trimmedUrl.startsWith(this.publicBaseUrl)) {
            this.logger.warn(`(Azure getBlobNameFromUrl) URL "${url}" does not match publicBaseUrl "${this.publicBaseUrl}"`);
            return null;
        }
        let blobName = trimmedUrl.substring(this.publicBaseUrl.length);
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        try {
            return decodeURIComponent(blobName);
        } catch (e) {
            this.logger.error(`(Azure getBlobNameFromUrl) Failed to decode blob name from URL "${url}": ${e.message}`);
            return null; // Hoặc trả về blobName chưa decode nếu muốn
        }
    }

    async saveFiles(temporaryFiles: Express.Multer.File[], type: FileType): Promise<SavedFileResult[]> {
        if (!temporaryFiles || temporaryFiles.length === 0) {
            return [];
        }

        const blobPathPrefix = this.getBlobPathPrefix(type);
        const results: SavedFileResult[] = [];
        const successfullyUploadedBlobNames: string[] = [];

        for (const tempFile of temporaryFiles) {
            if (!tempFile || !tempFile.originalname) { // tempFile.path có thể không có nếu dùng MemoryStorage
                this.logger.error('(Azure saveFiles) Invalid file object!', { tempFile });
                await this.deleteByIdentifiers(successfullyUploadedBlobNames); // Rollback
                throw new InternalServerErrorException('Invalid file object provided.');
            }

            const finalBlobName = this.generateUniqueBlobName(tempFile.originalname, blobPathPrefix);
            const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(finalBlobName);

            try {
                let uploadStream: Readable;
                let streamLength: number;

                if (tempFile.buffer) { // Nếu Multer dùng MemoryStorage
                    uploadStream = Readable.from(tempFile.buffer);
                    streamLength = tempFile.buffer.length;
                } else if (tempFile.path) { // Nếu Multer lưu file tạm vào disk
                    // Kiểm tra file có tồn tại không trước khi tạo stream
                    try {
                        await fs.access(tempFile.path); // Check if file exists and is accessible
                    } catch (accessError) {
                        this.logger.error(`(Azure saveFiles) Temporary file not found or not accessible: ${tempFile.path}`, accessError.stack);
                        await this.deleteByIdentifiers(successfullyUploadedBlobNames); // Rollback
                        throw new InternalServerErrorException(`Temporary file for "${tempFile.originalname}" not found.`);
                    }
                    const fileReadStream = (await import('fs')).createReadStream(tempFile.path); // Dynamic import fs
                    uploadStream = fileReadStream;
                    const stats = await fs.stat(tempFile.path);
                    streamLength = stats.size;
                } else {
                    this.logger.error(`(Azure saveFiles) File object for "${tempFile.originalname}" has neither buffer nor path.`);
                    await this.deleteByIdentifiers(successfullyUploadedBlobNames); // Rollback
                    throw new InternalServerErrorException(`Cannot read file data for "${tempFile.originalname}".`);
                }
                
                this.logger.debug(`(Azure saveFiles) Uploading "${tempFile.originalname}" as "${finalBlobName}" with type "${tempFile.mimetype}" and length ${streamLength}`);

                await blockBlobClient.uploadStream(uploadStream, streamLength, undefined, {
                    blobHTTPHeaders: { blobContentType: tempFile.mimetype || 'application/octet-stream' },
                });

                // Cleanup temp file if it was saved to disk by Multer
                if (tempFile.path) {
                    fs.unlink(tempFile.path).catch(err => 
                        this.logger.warn(`(Azure saveFiles) Failed to delete temp file ${tempFile.path}: ${err.message}`)
                    );
                }

                const finalUrl = `${this.publicBaseUrl}/${finalBlobName}`;
                results.push({
                    url: finalUrl,
                    identifier: finalBlobName, // Identifier là tên blob đầy đủ (bao gồm prefix)
                    storageType: 'azure_blob',
                    originalName: tempFile.originalname,
                });
                successfullyUploadedBlobNames.push(finalBlobName);
                this.logger.log(`(Azure saveFiles) Saved: ${tempFile.originalname} -> ${finalBlobName} | URL: ${finalUrl}`);

            } catch (uploadError) {
                this.logger.error(`(Azure saveFiles) Error uploading ${tempFile.originalname} to ${finalBlobName}: ${uploadError.message}`, uploadError.stack);
                // Rollback: Xóa các file đã upload thành công trong batch này
                await this.deleteByIdentifiers(successfullyUploadedBlobNames);
                // Cố gắng xóa file tạm nếu còn
                if (tempFile.path) {
                    fs.unlink(tempFile.path).catch(e => 
                        this.logger.warn(`(Azure saveFiles) Failed to delete temp file ${tempFile.path} after upload error: ${e.message}`)
                    );
                }
                throw new InternalServerErrorException(`Failed to save file "${tempFile.originalname}" to Azure Blob Storage.`);
            }
        }
        return results;
    }

    async deleteByIdentifiers(blobNames: string[]): Promise<void> {
        if (!blobNames || blobNames.length === 0) {
            return;
        }
        this.logger.log(`(Azure deleteByIdentifiers) Deleting ${blobNames.length} blobs by name...`);
        const deletionPromises = blobNames.map(async (blobName) => {
            const trimmedBlobName = blobName?.trim();
            if (!trimmedBlobName) return;

            try {
                const blobClient = this.containerClient.getBlobClient(trimmedBlobName);
                await blobClient.deleteIfExists({ deleteSnapshots: 'include' }); // Xóa cả snapshots nếu có
                this.logger.log(`(Azure deleteByIdentifiers) Deleted blob: ${trimmedBlobName}`);
            } catch (error) {
                 // RestError là kiểu lỗi từ Azure SDK
                if (error instanceof RestError && error.statusCode === 404) {
                    this.logger.warn(`(Azure deleteByIdentifiers) Blob not found (404): ${trimmedBlobName}`);
                } else {
                    this.logger.error(`(Azure deleteByIdentifiers) Error deleting blob "${trimmedBlobName}": ${error.message}`);
                    // Không ném lỗi ở đây để các file khác vẫn được thử xóa
                }
            }
        });
        await Promise.all(deletionPromises);
        this.logger.log(`(Azure deleteByIdentifiers) Finished blob name deletions.`);
    }

    async deleteByUrls(urls: string[]): Promise<void> {
        if (!urls || urls.length === 0) {
            return;
        }
        this.logger.log(`(Azure deleteByUrls) Deleting ${urls.length} blobs by URL...`);
        const blobNamesToDelete = urls
            .map(url => this.getBlobNameFromUrl(url))
            .filter((name): name is string => !!name);

        if (blobNamesToDelete.length > 0) {
            await this.deleteByIdentifiers(blobNamesToDelete);
        } else {
            this.logger.log(`(Azure deleteByUrls) No valid blob names derived from URLs.`);
        }
        this.logger.log(`(Azure deleteByUrls) Finished URL deletions.`);
    }
}