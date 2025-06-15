import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient, RestError, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { IStorageStrategy, SavedFileResult } from './storage.strategy.interface';
import { FileType } from './file-storage.types';
import path from 'path';

@Injectable()
export class AzureBlobStorageStrategy implements IStorageStrategy {
    private readonly logger = new Logger(AzureBlobStorageStrategy.name);
    private readonly blobServiceClient: BlobServiceClient;

    constructor(private readonly configService: ConfigService) {
        const accountName = this.configService.get<string>(
            'AZURE_STORAGE_ACCOUNT_NAME',
        );
        const accountKey = this.configService.get<string>(
            'AZURE_STORAGE_ACCOUNT_KEY',
        );

        if (!accountName || !accountKey) {
            this.logger.error('Azure Storage credentials not provided');
            throw new Error('Azure Storage configuration is missing');
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(
            accountName,
            accountKey,
        );
        this.blobServiceClient = new BlobServiceClient(
            `https://${accountName}.blob.core.windows.net`,
            sharedKeyCredential,
        );

        this.logger.log('Azure Blob Service initialized successfully');
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

    private getContainerName(): string {
        const prefix = this.configService.get<string>(
            'AZURE_CONTAINER_PREFIX',
            'farmera',
        );
        return `${prefix}-product`;
    }

    async saveFiles(temporaryFiles: Express.Multer.File[], type: FileType): Promise<SavedFileResult[]> {
        if (!temporaryFiles || temporaryFiles.length === 0) {
            return [];
        }

        const containerName = this.getContainerName();
        const blobPathPrefix = this.getBlobPathPrefix(type);
        const results: SavedFileResult[] = [];
        const successfullyUploadedBlobNames: string[] = [];

        // Get container client
        const containerClient = this.blobServiceClient.getContainerClient(containerName);

        // Create container if it doesn't exist
        await containerClient.createIfNotExists({
            // Remove public access since the storage account doesn't allow it
            // Files will be accessible via SAS tokens or authenticated requests
        });

        for (const tempFile of temporaryFiles) {
            if (!tempFile || !tempFile.originalname) { // tempFile.path có thể không có nếu dùng MemoryStorage
                this.logger.error('(Azure saveFiles) Invalid file object!', { tempFile });
                await this.deleteByIdentifiers(successfullyUploadedBlobNames); // Rollback
                throw new InternalServerErrorException('Invalid file object provided.');
            }

            const finalBlobName = this.generateUniqueBlobName(tempFile.originalname, blobPathPrefix);
            const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(finalBlobName);

            // Set content type and metadata
            const options = {
                blobHTTPHeaders: {
                    blobContentType: tempFile.mimetype,
                },
                metadata: {
                    originalName: tempFile.originalname,
                    uploadedAt: new Date().toISOString(),
                    groupType: "product",
                },
            };

            try {
                // Upload file
                const uploadResponse = await blockBlobClient.upload(
                    tempFile.buffer,
                    tempFile.size,
                    options,
                );

                if (uploadResponse.errorCode) {
                    throw new Error(`Upload failed: ${uploadResponse.errorCode}`);
                }

                const fileUrl = blockBlobClient.url;

                results.push({
                    url: fileUrl,
                    identifier: finalBlobName, // Identifier là tên blob đầy đủ (bao gồm prefix)
                    storageType: 'azure_blob',
                    originalName: tempFile.originalname,
                });

                successfullyUploadedBlobNames.push(finalBlobName);

                this.logger.log(`(Azure saveFiles) Saved: ${tempFile.originalname} -> ${finalBlobName} | URL: ${fileUrl}`);

            } catch (uploadError) {
                this.logger.error(`(Azure saveFiles) Error uploading ${tempFile.originalname} to ${finalBlobName}: ${uploadError.message}`, uploadError.stack);
                // Rollback: Xóa các file đã upload thành công trong batch này
                await this.deleteByIdentifiers(successfullyUploadedBlobNames);

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
                const containerClient = this.blobServiceClient.getContainerClient(this.getContainerName());
                const blobClient = containerClient.getBlobClient(trimmedBlobName);
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
            .map(url => this.parseAzureUrl(url)?.blobName)
            .filter((name): name is string => !!name);

        if (blobNamesToDelete.length > 0) {
            await this.deleteByIdentifiers(blobNamesToDelete);
        } else {
            this.logger.log(`(Azure deleteByUrls) No valid blob names derived from URLs.`);
        }
        this.logger.log(`(Azure deleteByUrls) Finished URL deletions.`);
    }

    private parseAzureUrl(url: string): { containerName: string; blobName: string } | null {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname
                .split('/')
                .filter((part) => part.length > 0);

            if (pathParts.length < 2) {
                return null;
            }

            const containerName = pathParts[0];
            const blobName = pathParts.slice(1).join('/');

            return { containerName, blobName };
        } catch (error) {
            this.logger.error(`Failed to parse Azure URL: ${url}`, error.stack);
            return null;
        }
    }
}