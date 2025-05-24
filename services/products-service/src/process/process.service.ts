import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateProcessDto } from './dto/create-process.dto';
import { PinataStorageService } from 'src/services/pinata-storage.service';
import { BlockchainService } from 'src/services/blockchain.service';

@Injectable()
export class ProcessService {

    private readonly logger = new Logger(ProcessService.name);

    constructor(
        @InjectRepository(Process)
        private readonly processRepository: Repository<Process>,
        private readonly dataSource: DataSource,
        private readonly pinataStorageService: PinataStorageService,
        private readonly blockchainService: BlockchainService
    ) { }

    async createProcess(
        createProcessDto: CreateProcessDto,
        userId: string,
        files: {
            process_images: Express.Multer.File[],
            process_videos?: Express.Multer.File[]
        }
    ) {
        // !TODO: validate if user own the product

        let imageCidsResult: string[] = [];
        let videoCidsResult: string[] = [];

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (files.process_images && files.process_images.length > 0) {
                // Upload images to Pinata
                imageCidsResult = await this.pinataStorageService.uploadMutipleFiles(files.process_images);
            }

            if (files.process_videos && files.process_videos.length > 0) {
                // Upload videos to Pinata
                videoCidsResult = await this.pinataStorageService.uploadMutipleFiles(files.process_videos);
            }

            const imageCids = imageCidsResult.length > 0 ? imageCidsResult : null;
            if (!imageCids) {
                throw new BadRequestException('Không có ảnh nào được tải lên');
            }

            const videoCids = videoCidsResult.length > 0 ? videoCidsResult : null;

            const process = this.processRepository.create(createProcessDto);
            process.imageCids = imageCids;
            process.videoCids = videoCids;

            const createdProcess = await queryRunner.manager.save(process);

            // Add process to blockchain
            const transaction = await this.blockchainService.addProcess(createdProcess);

            // Save transaction to database
            await queryRunner.commitTransaction();

            return {
                data: {
                    createdProcess,
                    transaction
                }
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();

            this.logger.error(`Error in createProcess: ${error}`);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(`Không thể quy trình sản xuất`);
        }
    }

    async getProcesses(productId: string) {
        return await this.processRepository.findBy({ productId: productId });
    }

    async getProcess(processId: number) {
        const process = await this.processRepository.findOneBy({ processId: processId });
        if (!process) {
            throw new BadRequestException('Không tìm thấy quy trình sản xuất');
        }
        return process;
    }

    async getOnChainProcess(processId: number) {
        const process = await this.blockchainService.getProcess(processId);
        if (!process) {
            throw new BadRequestException('Không tìm thấy quy trình sản xuất trên blockchain');
        }
        return process;
    }

    async getOnChainProductProcessIds(productId: string) {
        const processIds = await this.blockchainService.getProductProcessIds(productId);
        if (!processIds) {
            throw new BadRequestException('Không tìm thấy quy trình sản xuất trên blockchain');
        }
        return processIds;
    }

    // Get process and verify it
    async getVerifiedProcess(processId: number) {
        const process = await this.processRepository.findOneBy({ processId: processId });
        if (!process) {
            throw new BadRequestException('Không tìm thấy quy trình sản xuất');
        }

        const result = await this.blockchainService.verifyProcess(process);

        return {
            process,
            result
        };
    }

    async getVerifiedProcesses(productId: string) {
        const processes = await this.processRepository.findBy({ productId: productId });

        const verifiedProcesses = await Promise.all(processes.map(async (process) => {
            const result = await this.blockchainService.verifyProcess(process);
            return {
                process,
                result
            };
        }))

        return verifiedProcesses;
    }
}
