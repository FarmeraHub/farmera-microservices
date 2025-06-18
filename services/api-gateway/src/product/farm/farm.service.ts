import { ProductsServiceClient, VerifyFarmRequest } from '@farmera/grpc-proto/dist/products/products';
import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { FarmMapper } from 'src/mappers/product/farm.mapper';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';
import { randomUUID } from 'crypto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { Farm } from './entities/farm.entity';
import { SearchFarmDto } from './dto/search-farm.dto';
import { plainToInstance } from 'class-transformer';
import { TypesMapper } from 'src/mappers/common/types.mapper';

@Injectable()
export class FarmService implements OnModuleInit {

    private readonly logger = new Logger(FarmService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(
        @Inject("PRODUCTS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }

    async farmRegister(farmRegistrationDto: FarmRegistrationDto, userId: string) {
        try {
            const result = await firstValueFrom(this.productGrpcService.createFarm(FarmMapper.toGrpcCreateFarmRequest(farmRegistrationDto, userId)));
            return FarmMapper.fromGrpcFarm(result.farm);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async farmVerify(ssn_image: Express.Multer.File, biometric_video: Express.Multer.File, farmId: string, userId: string) {
        const CHUNK_SIZE = 64 * 1024; // 64 KB

        const files = [
            { file: ssn_image, file_type: 'ssn_image' },
            { file: biometric_video, file_type: 'biometric_video' },
        ];

        const request$ = new Observable<VerifyFarmRequest>(subscriber => {
            for (const { file, file_type } of files) {

                const id = randomUUID();
                // send metadata
                subscriber.next({
                    meta: {
                        farm_id: farmId,
                        file_id: id,
                        file_name: file.originalname,
                        mime_type: file.mimetype,
                        total_size: file.buffer.length,
                        file_type: file_type,
                        user_id: userId
                    },
                });

                // send chunks
                let offset = 0;
                while (offset < file.buffer.length) {
                    const end = Math.min(offset + CHUNK_SIZE, file.buffer.length);
                    const chunk = file.buffer.subarray(offset, end);

                    subscriber.next({
                        chunk: {
                            file_id: id,
                            data: chunk,
                        }
                    });

                    offset = end;
                }
            }
            subscriber.complete();
        });

        try {
            const result = await firstValueFrom(this.productGrpcService.verifyFarm(request$));
            return FarmMapper.fromGrpcFarm(result.farm);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getFarm(farmId: string) {
        try {
            const result = await firstValueFrom(this.productGrpcService.getFarm({
                farm_id: farmId,
            }));

            return FarmMapper.fromGrpcFarm(result.farm);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getFarmByUserId(userId: string) {
        try {
            const result = await firstValueFrom(this.productGrpcService.getFarmByUser({
                user_id: userId
            }));

            return FarmMapper.fromGrpcFarm(result.farm);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async listFarms(pagination?: PaginationOptions): Promise<PaginationResult<Farm>> {
        try {
            const result = await firstValueFrom(this.productGrpcService.listFarms({
                pagination: PaginationMapper.toGrpcPaginationRequest(pagination),
            }));
            return {
                data: result.farms.map((value) => FarmMapper.fromGrpcFarm(value)),
                pagination: PaginationMapper.fromGrpcPaginationResponse(result.pagination),
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async searchFarms(searchDto: SearchFarmDto): Promise<PaginationResult<Farm>> {
        try {
            const result = await firstValueFrom(this.productGrpcService.searchFarm({
                search_query: searchDto.query,
                pagination: PaginationMapper.toGrpcPaginationRequest({
                    page: searchDto.page,
                    limit: searchDto.limit,
                    sort_by: searchDto.sort_by,
                    order: searchDto.order,
                    all: searchDto.all,
                    skip: searchDto.skip,
                }),
                approved_only: searchDto.approve_only,
                location_filter: { latitude: searchDto.latitude, longitude: searchDto.longitude, radius_km: searchDto.radius_km }
            }));
            return {
                data: result.farms.map((value) => FarmMapper.fromGrpcFarm(value)),
                pagination: PaginationMapper.fromGrpcPaginationResponse(result.pagination),
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
