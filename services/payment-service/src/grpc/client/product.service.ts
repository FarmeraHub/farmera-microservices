// payment-service/src/grpc/client/payment-grpc.client.service.ts
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ClientGrpc, RpcException } from "@nestjs/microservices";
import {
    GetListProductsRequest as GrpcGetListProductsRequest,
    GetListProductsResponse as GrpcGetListProductsResponse,
    ProductsServiceClient
} from "@farmera/grpc-proto/dist/products/products";
import { firstValueFrom } from "rxjs";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { TypesMapper } from "src/mappers/common/types.mapper";
import { ProductMapper } from "src/mappers/product/product.mapper";
import { Product } from "src/product/product/entities/product.entity";
import { Farm } from "src/product/farm/entities/farm.entity";
import { FarmMapper } from "src/mappers/product/farm.mapper";

// Define ProductOptions interface
interface ProductOptions {
    include_farm?: boolean;
}




@Injectable()
export class ProductsGrpcClientService implements OnModuleInit {
    private readonly logger = new Logger(ProductsGrpcClientService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(
        @Inject("PRODUCTS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }
    async getListProducts(product_ids: number[], productOptions?: ProductOptions): Promise<Product[]> {
        try {
            const response = await firstValueFrom(
                this.productGrpcService.getListProducts({
                    product_ids: product_ids,
                    options: TypesMapper.toGrpcProductOptions({
                        include_farm: true,
                    })
                })
            );
            const mappedProducts: (Product | undefined)[] = response.products.map((grpcProduct) =>
                ProductMapper.fromGrpcProduct(grpcProduct)
            );

            const validProducts: Product[] = mappedProducts.filter(
                (product): product is Product => product !== undefined
            );

            return validProducts;

        } catch (error) {
            this.logger.error(error.message);
            throw ErrorMapper.toRpcException(error);
        }
    }
    async getFarm(farmId: string): Promise<Farm> {
        try {
            const response = await firstValueFrom(
                this.productGrpcService.getFarm({ farm_id: farmId })
            );
    
            const farm = FarmMapper.fromGrpcFarm(response.farm!);
            if (!farm) {
                throw new RpcException(`Farm with ID ${farmId} could not be mapped from gRPC response`);
            }
            return farm;
        } catch (error) {
            this.logger.error(error.message);
            throw ErrorMapper.toRpcException(error);
        }
    }


}