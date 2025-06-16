import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { Repository } from 'typeorm';
import { CreateProcessDto } from './dto/create-process.dto';
import { Product } from 'src/products/entities/product.entity';
import { PaginationOrder } from 'src/common/enums/pagination.enums';

@Injectable()
export class ProcessService {
    private readonly logger = new Logger(ProcessService.name);

    constructor(
        @InjectRepository(Process)
        private readonly processRepository: Repository<Process>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) { }

    async createProcess(createProcessDto: CreateProcessDto, userId: string) {
        const product = await this.productRepository.findOne({ where: { farm: { user_id: userId } } });
        if (!product) {
            throw new UnauthorizedException("Người dùng không sở hữu sản phẩm");
        }

        try {
            const process = this.processRepository.create(createProcessDto);
            process.product = product;
            return await this.processRepository.save(process);
        }
        catch (error) {
            this.logger.error(`Error in createProcess: ${error}`);
            throw new InternalServerErrorException(`Không thể quy trình sản xuất`);
        }
    }

    async getProcesses(
        productId: number,
        limit?: number,
        order: PaginationOrder = PaginationOrder.DESC,
        cursor?: string
    ) {
        const qb = this.processRepository.createQueryBuilder("process")
            .andWhere("process.product.product_id = :productId", { productId })
            .leftJoin("process.product", "product")
            .addSelect("product.product_id", "product_product_id")
            .limit(limit)
            .orderBy("process.process_id", order);
        if (cursor) {
            if (order === "DESC") {
                qb.andWhere("process.process_id < :cursor", { cursor })
            }
            else {
                qb.andWhere("process.process_id > :cursor", { cursor })
            }
        }

        try {
            const processes = await qb.getMany();


            // create next cursor
            let nextCursor: string | null = null;
            if (processes.length === limit) {
                const lastProcess = processes[processes.length - 1];
                nextCursor = lastProcess.process_id.toString();
            }

            return {
                data: {
                    processes,
                    nextCursor
                },
            };
        }
        catch (err) {
            this.logger.error(err.message);
            throw new InternalServerErrorException(err.message);
        }
    }

    async getProcess(processId: number) {
        const process = await this.processRepository.findOne({ where: { process_id: processId }, relations: ["product"] });
        if (!process) {
            throw new NotFoundException('Không tìm thấy quy trình sản xuất');
        }
        return process;
    }

    // Block chain methods
    // async getOnChainProcess(processId: number) {
    //     const process = await this.blockchainService.getProcess(processId);
    //     if (!process) {
    //         throw new BadRequestException('Không tìm thấy quy trình sản xuất trên blockchain');
    //     }
    //     return process;
    // }

    // async getOnChainProductProcessIds(productId: string) {
    //     const processIds = await this.blockchainService.getProductProcessIds(productId);
    //     if (!processIds) {
    //         throw new BadRequestException('Không tìm thấy quy trình sản xuất trên blockchain');
    //     }
    //     return processIds;
    // }

    // // Get process and verify it
    // async getVerifiedProcess(processId: number) {
    //     const process = await this.processRepository.findOneBy({ process_id: processId });
    //     if (!process) {
    //         throw new BadRequestException('Không tìm thấy quy trình sản xuất');
    //     }

    //     const result = await this.blockchainService.verifyProcess(process);

    //     return {
    //         process,
    //         result
    //     };
    // }

    // async getVerifiedProcesses(productId: number) {
    //     const processes = await this.processRepository.find({ where: { product: { product_id: productId } } });

    //     const verifiedProcesses = await Promise.all(processes.map(async (process) => {
    //         const result = await this.blockchainService.verifyProcess(process);
    //         return {
    //             process,
    //             result
    //         };
    //     }))

    //     return verifiedProcesses;
    // }

    private encodeCursor(payload: string): string {
        this.logger.debug(`Encode cursor: ${payload}`);
        return Buffer.from(payload).toString('base64');
    }

    private decodeCursor(cursor: string): string {
        try {
            const result = Buffer.from(cursor, 'base64').toString('utf8');
            this.logger.debug(`Decoded cursor: ${result}`)
            return result;
        } catch (err) {
            throw new BadRequestException('Invalid cursor');
        }
    }
}
