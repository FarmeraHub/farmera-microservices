import { Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { IStorageStrategy, SavedFileResult, STORAGE_STRATEGY } from './storage.strategy.interface';
import { FileType } from './file-storage.types';

@Injectable()
export class FileStorageService {
    private readonly logger = new Logger(FileStorageService.name);

    constructor(
        @Inject(STORAGE_STRATEGY) private readonly storageStrategy: IStorageStrategy,
    ) {
        this.logger.log(`FileStorageService initialized with strategy: ${storageStrategy.constructor.name}`);
    }

    async saveFiles(temporaryFiles: Express.Multer.File[], type: FileType): Promise<SavedFileResult[]> {
        this.logger.log(`(Service) Delegating saveFiles for type "${type}" to ${this.storageStrategy.constructor.name}`);
        try {
            // Gọi phương thức của strategy đã được inject
            return await this.storageStrategy.saveFiles(temporaryFiles, type);
        } catch (error) {
            this.logger.error(`(Service) Error during saveFiles delegation: ${error.message}`, error.stack);
            throw error; // Ném lại lỗi để lớp gọi xử lý (rollback)
        }
    }

    /**
     * Xóa files theo URL sử dụng strategy hiện tại.
     */
    async deleteFilesByUrl(urls: string[]): Promise<void> {
        this.logger.log(`(Service) Delegating deleteByUrls to ${this.storageStrategy.constructor.name}`);
        try {
            await this.storageStrategy.deleteByUrls(urls);
        } catch (error) {
            this.logger.error(`(Service) Error during deleteByUrls delegation: ${error.message}`, error.stack);
            // Không ném lại lỗi xóa file để tránh làm hỏng luồng chính
        }
    }

    /**
     * Xóa files theo định danh (path/key) sử dụng strategy hiện tại.
     * Dùng chủ yếu để dọn dẹp khi rollback.
     */
    async deleteFilesByIdentifier(identifiers: string[]): Promise<void> {
        this.logger.log(`(Service) Delegating deleteByIdentifiers to ${this.storageStrategy.constructor.name}`);
        try {
            await this.storageStrategy.deleteByIdentifiers(identifiers);
        } catch (error) {
            this.logger.error(`(Service) Error during deleteByIdentifiers delegation: ${error.message}`, error.stack);
        }
    }

    /**
     * Helper để dọn dẹp files dựa trên kết quả trả về từ saveFiles (khi rollback).
     */
    async cleanupFiles(savedResults: SavedFileResult[]): Promise<void> {
        if (!savedResults || savedResults.length === 0) { return; }
        this.logger.warn(`(Service) Initiating cleanup for ${savedResults.length} saved files due to failure...`);

        const identifiersToDelete = savedResults.map(r => r.identifier).filter(id => id) as string[]; // Assuming identifier is always string

        if (identifiersToDelete.length > 0) {
            try {
                this.logger.debug(`(Service) Attempting to delete identifiers: ${JSON.stringify(identifiersToDelete)}`);
                await this.deleteFilesByIdentifier(identifiersToDelete);
                this.logger.warn(`(Service) Cleanup process completed for identifiers: ${JSON.stringify(identifiersToDelete)}.`);
            } catch (error) {
                this.logger.error(`(Service) Error during deleteFilesByIdentifier:`, error);
                // Optionally, rethrow or handle as needed
            }
        } else {
            this.logger.warn(`(Service) No valid identifiers found for cleanup.`);
        }
    }
}