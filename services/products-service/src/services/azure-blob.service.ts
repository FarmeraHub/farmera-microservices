import {
    BlobServiceClient,
    StorageSharedKeyCredential,
    BlobSASPermissions,
} from '@azure/storage-blob';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import mime from 'mime';
import { basename } from 'path';
import { randomUUID } from 'crypto';

export type FileInfo = {
    name: string;
    url: string;
    contentType?: string;
    contentLength?: number;
    lastModified: Date;
};

@Injectable()
export class AzureBlobService {
    private readonly logger = new Logger(AzureBlobService.name);
    private blobServiceClient: BlobServiceClient;

    constructor(private configService: ConfigService) {
        this.initializeBlobService();
    }

    private initializeBlobService() {
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

    async getFileInfo(fileUrl: string) {
        try {
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;

            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            const properties = await blobClient.getProperties();

            return {
                url: fileUrl,
                contentType: properties.contentType,
                contentLength: properties.contentLength,
                lastModified: properties.lastModified,
                metadata: properties.metadata,
            };
        } catch (error) {
            this.logger.error(
                `Failed to get file info: ${error.message}`,
                error.stack,
            );
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }

    private parseAzureUrl(
        url: string,
    ): { containerName: string; blobName: string } | null {
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

    // Generate SAS token for secure file access
    async generateSasUrl(
        fileUrl: string,
        expiresInHours: number = 24,
    ): Promise<string> {
        try {
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            // Generate SAS token for read access
            const sasOptions = {
                permissions: BlobSASPermissions.parse('r'), // read permission
                expiresOn: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
            };

            const sasUrl = await blobClient.generateSasUrl(sasOptions);
            return sasUrl;
        } catch (error) {
            this.logger.error(
                `Failed to generate SAS URL: ${error.message}`,
                error.stack,
            );
            throw new Error(`Failed to generate SAS URL: ${error.message}`);
        }
    }

    async getMulterFileFromBlob(blobUrl: string): Promise<Express.Multer.File> {
        try {
            const urlParts = this.parseAzureUrl(blobUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;

            console.log(containerName, blobName);

            // Get blob client
            const containerClient = this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlobClient(blobName);

            // Download blob
            const downloadResponse = await blobClient.download();
            if (!downloadResponse.readableStreamBody) {
                throw Error("Invalid readable stream body")
            }

            const blobBuffer = await this.streamToBuffer(downloadResponse.readableStreamBody);

            // Create a Readable stream from the Buffer
            const blobStream = new Readable();
            blobStream.push(blobBuffer);
            blobStream.push(null); // Signal end of stream

            // Get blob properties for metadata
            const blobProperties = await blobClient.getProperties();
            const mimeType =
                blobProperties.contentType || mime.lookup(blobName) || 'application/octet-stream';
            const originalName = basename(blobName);

            // Construct Multer.File object
            const multerFile: Express.Multer.File = {
                fieldname: 'file',
                originalname: originalName,
                encoding: '7bit',
                mimetype: mimeType,
                buffer: blobBuffer,
                size: blobBuffer.length,
                destination: '',
                filename: originalName,
                path: '',
                stream: blobStream
            };

            return multerFile;
        } catch (error) {
            throw new Error(`Failed to retrieve blob: ${error.message}`);
        }
    }

    private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            readableStream.on('data', (data) => chunks.push(Buffer.from(data)));
            readableStream.on('end', () => resolve(Buffer.concat(chunks)));
            readableStream.on('error', reject);
        });
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extract container and blob name from URL
            const urlParts = this.parseAzureUrl(fileUrl);
            if (!urlParts) {
                throw new Error('Invalid Azure blob URL');
            }

            const { containerName, blobName } = urlParts;

            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);
            const blobClient = containerClient.getBlockBlobClient(blobName);

            const deleteResponse = await blobClient.deleteIfExists();

            if (deleteResponse.succeeded) {
                this.logger.log(`File deleted successfully: ${fileUrl}`);
                return true;
            } else {
                this.logger.warn(`File not found for deletion: ${fileUrl}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`File deletion failed: ${error.message}`);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        customName?: string,
    ): Promise<string> {
        try {
            const containerName = this.getPrivateContainerName();
            const fileName = this.generateFileName(file, customName);

            // Get container client
            const containerClient =
                this.blobServiceClient.getContainerClient(containerName);

            // Create container if it doesn't exist
            await containerClient.createIfNotExists({
                // Remove public access since the storage account doesn't allow it
                // Files will be accessible via SAS tokens or authenticated requests
            });

            // Get blob client
            const blobClient = containerClient.getBlockBlobClient(fileName);

            // Set content type and metadata
            const options = {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype,
                },
                metadata: {
                    originalName: file.originalname,
                    uploadedAt: new Date().toISOString(),
                    groupType: "product",
                },
            };

            // Upload file
            const uploadResponse = await blobClient.upload(
                file.buffer,
                file.size,
                options,
            );

            if (uploadResponse.errorCode) {
                throw new Error(`Upload failed: ${uploadResponse.errorCode}`);
            }

            // Return the blob URL (will need SAS token for access if private)
            const fileUrl = blobClient.url;
            this.logger.log(`File uploaded successfully: ${fileUrl}`);

            return fileUrl;
        } catch (error) {
            this.logger.error(`File upload failed: ${error.message}`, error.stack);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    private getPrivateContainerName(): string {
        const prefix = this.configService.get<string>(
            'AZURE_PRIVATE_CONTAINER_PREFIX',
            'farmera-private',
        );
        return `${prefix}-product`;
    }

    private generateFileName(
        file: Express.Multer.File,
        customName?: string,
    ): string {
        const timestamp = Date.now();
        const uuid = randomUUID();
        const extension = this.getFileExtension(file.originalname);

        if (customName) {
            return `${customName}-${timestamp}-${uuid}${extension}`;
        }

        const baseName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
        return `${baseName}-${timestamp}-${uuid}${extension}`;
    }

    private getFileExtension(filename: string): string {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    }
}
