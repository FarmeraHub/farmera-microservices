import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateProcessDto } from './dto/create-process.dto';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { Process } from './entities/process.entity';
import { ProcessMapper } from 'src/mappers/product/process.mapper';
import { firstValueFrom } from 'rxjs';
import { SimpleCursorPagination } from 'src/common/dto/pagination.dto';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';

@Injectable()
export class ProcessService {
    private readonly logger = new Logger(ProcessService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(@Inject("PRODUCTS_PACKAGE") private client: ClientGrpc) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }

    async createProcess(userId: string, createProcessDto: CreateProcessDto): Promise<Process> {
        try {
            const result = await firstValueFrom(this.productGrpcService.createProcess({
                product_id: createProcessDto.product_id,
                stage_name: createProcessDto.stage_name,
                description: createProcessDto.description,
                start_date: TypesMapper.toGrpcTimestamp(createProcessDto.start_date),
                end_date: TypesMapper.toGrpcTimestamp(createProcessDto.end_date),
                latitude: createProcessDto.latitude,
                longitude: createProcessDto.longitude,
                image_urls: createProcessDto.image_urls,
                video_urls: createProcessDto.video_urls ? { list: createProcessDto.video_urls } : undefined,
                user_id: userId,
            }));

            return ProcessMapper.fromGrpcProcess(result.process);
        }
        catch (err) {
            this.logger.error(err.message);
            throw new BadRequestException();
        }
    }

    async getProcess(processId: number): Promise<Process> {
        try {
            const result = await firstValueFrom(this.productGrpcService.getProcess({
                process_id: processId
            }));

            return ProcessMapper.fromGrpcProcess(result.process);
        }
        catch (err) {
            this.logger.error(err.message);
            throw new BadRequestException();
        }
    }

    async getProcesses(product_id: number, cursorPagination: SimpleCursorPagination) {
        try {
            const result = await firstValueFrom(this.productGrpcService.listProcesses({
                pagination: PaginationMapper.toGrpcSimpleCursorPaginationRequest(cursorPagination),
                product_id: product_id,
            }));

            const processes = result.processes.map((value) => ProcessMapper.fromGrpcProcess(value));
            const next_cursor = result.pagination.next_cursor || null;
            return { processes, pagination: { next_cursor } };
        }
        catch (err) {
            throw new BadRequestException();
        }
    }
}
