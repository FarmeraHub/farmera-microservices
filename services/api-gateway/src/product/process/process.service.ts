import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateProcessDto } from './dto/create-process.dto';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { Process } from './entities/process.entity';
import { ProcessMapper } from 'src/mappers/product/process.mapper';
import { firstValueFrom } from 'rxjs';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';
import { EnumMapper } from 'src/mappers/common/enum.mapper';

@Injectable()
export class ProcessService {
  private readonly logger = new Logger(ProcessService.name);
  private productGrpcService: ProductsServiceClient;

  constructor(@Inject('PRODUCTS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.productGrpcService =
      this.client.getService<ProductsServiceClient>('ProductsService');
  }

  async createProcess(
    userId: string,
    createProcessDto: CreateProcessDto,
  ): Promise<Process> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createProcess({
          product_id: createProcessDto.product_id,
          stage_name: EnumMapper.toGrpcProcessStage(
            createProcessDto.stage_name,
          ),
          description: createProcessDto.description,
          start_date: TypesMapper.toGrpcTimestamp(createProcessDto.start_date),
          end_date: TypesMapper.toGrpcTimestamp(createProcessDto.end_date),
          latitude: createProcessDto.latitude,
          longitude: createProcessDto.longitude,
          image_urls: createProcessDto.image_urls,
          video_urls: createProcessDto.video_urls
            ? { list: createProcessDto.video_urls }
            : undefined,
          user_id: userId,
        }),
      );

      return ProcessMapper.fromGrpcProcess(result.process);
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProcess(processId: number): Promise<Process> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProcess({
          process_id: processId,
        }),
      );

      return ProcessMapper.fromGrpcProcess(result.process);
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProcesses(
    product_id: number,
    cursorPagination: SimpleCursorPagination,
  ) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.listProcesses({
          product_id: product_id,
        }),
      );

      const processes = result.processes.map((value) =>
        ProcessMapper.fromGrpcProcess(value),
      );
      return { processes, pagination: { next_cursor: null } };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }
}
