import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Process } from './entities/process.entity';
import { Repository } from 'typeorm';
import { CreateProcessDto } from './dto/create-process.dto';
import { Product } from 'src/products/entities/product.entity';
import { Order } from 'src/pagination/dto/pagination-options.dto';
import { ProcessStage, ProcessStageOrder } from 'src/common/enums/process-stage.enum';

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
        try {
            const product = await this.productRepository.findOne({ where: { farm: { user_id: userId }, product_id: createProcessDto.product_id } });
            if (!product) {
                throw new UnauthorizedException("Người dùng không sở hữu sản phẩm");
            }
            // Get latest stage
            const rawStage = await this.processRepository.createQueryBuilder("process")
                .select("process.stage_name", "stage_name")
                .where("process.product_id = :productId", { productId: createProcessDto.product_id })
                .orderBy(`
                    CASE
                        WHEN process.stage_name = '${ProcessStage.START}' THEN 1
                        WHEN process.stage_name = '${ProcessStage.PRODUCTION}' THEN 2
                        WHEN process.stage_name = '${ProcessStage.COMPLETION}' THEN 3 
                    END
                `, "DESC")
                .limit(1)
                .getRawOne();
            const latestStage = rawStage?.stage_name as ProcessStage;

            // Validate input stage
            if (latestStage === ProcessStage.COMPLETION) {
                throw new BadRequestException("Trạng thái không hợp lệ, sản phẩm đã hoàn thành");
            }

            if (createProcessDto.stage_name === ProcessStage.START) {
                if (latestStage) throw new BadRequestException("Trạng thái không hợp lệ, giai đoạn START đã tồn tại");
            }

            if (createProcessDto.stage_name === ProcessStage.PRODUCTION) {
                if (!latestStage) throw new BadRequestException("Trạng thái không hợp lệ, giai đoạn đầu tiên phải là START");
            }

            if (createProcessDto.stage_name === ProcessStage.COMPLETION) {
                if (!latestStage)
                    throw new BadRequestException("Trạng thái không hợp lệ, giai đoạn đầu tiên phải là START");
                if (latestStage === ProcessStage.START)
                    throw new BadRequestException("Trạng thái không hợp lệ, phải có ít nhất một PRODUCTION trước COMPLETION");
            }

            // Create process
            const process = this.processRepository.create({
                ...createProcessDto,
                product: product
            });
            return await this.processRepository.save(process);
        }
        catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Error in createProcess: ${error}`);
            throw new InternalServerErrorException(`Không thể tạo quy trình sản xuất`);
        }
    }

    async getProcesses(
        productId: number,
        limit?: number,
        order: Order = Order.DESC,
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
