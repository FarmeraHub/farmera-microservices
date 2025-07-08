import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ProductStatus } from 'src/common/enums/product/product-status.enum';
import { EnumMapper } from 'src/mappers/common/enum.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';
import { firstValueFrom } from 'rxjs';
import { Farm } from '../farm/entities/farm.entity';
import { FarmMapper } from 'src/mappers/product/farm.mapper';

@Injectable()
export class AdminService {

    private readonly logger = new Logger(AdminService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(
        @Inject("PRODUCTS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }

    async updateProductStatus(productId: number, status: ProductStatus) {
        try {
            return await firstValueFrom(this.productGrpcService.updateProductStatusForAdmin({
                product_id: productId,
                status: EnumMapper.toGrpcProductStatus(status),
            }));
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async updateFarmStatus(farmId: string, userId: string, UpdateFarmStatusDto: UpdateFarmStatusDto): Promise<Farm> {
        try {
            const result = await firstValueFrom(this.productGrpcService.updateFarmStatus({
                farm_id: farmId,
                user_id: userId,
                reason: UpdateFarmStatusDto.reason,
                status: UpdateFarmStatusDto.status,
            }));
            return FarmMapper.fromGrpcFarm(result.farm);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

}
