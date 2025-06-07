import { Product as ProductEntity } from './../../products/entities/product.entity';
import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod, RpcException } from "@nestjs/microservices";
import { CategoriesService } from "src/categories/categories.service";
import { FarmsService } from "src/farms/farms.service";
import { ProductsService } from "src/products/products.service";
import {
    ProductsServiceControllerMethods,
    ProductsServiceController,
    GetListProductsRequest,
    GetListProductsResponse,
    ProductRequest,
    ProductResponse,
    Product as GrpcProduct,
    Farm as GrpcFarm,
} from '@farmera/grpc-proto/dist/products/products';
import { Observable, of, throwError, map, catchError, tap, from } from 'rxjs';


import { ProductMapper } from './mappers/product.mapper';

@Controller()
@ProductsServiceControllerMethods()
export class ProductGrpcServerController implements ProductsServiceController {
    private readonly logger = new Logger(ProductGrpcServerController.name);

    constructor(
        private readonly productsService: ProductsService,
        private readonly farmsService: FarmsService,
        private readonly categoriesService: CategoriesService,
    ) { }
    async getListProducts(
        request: GetListProductsRequest,
    ): Promise<GetListProductsResponse> {
        // this.logger.log(`[gRPC In - GetListProducts] Received request: ${JSON.stringify(request)}`);

        if (!request.products || request.products.length === 0) {
            // this.logger.log('[gRPC In - GetListProducts] Request "products_requested" array is empty. Returning empty list.');
            return ProductMapper.toGrpcGetListProductsResponse([]);
        }

        const productIdsToFetch: number[] = request.products
            .map(pReq => pReq.product_id)
            .filter(id => id !== undefined && id !== null); // Lọc ID hợp lệ

        if (productIdsToFetch.length === 0) {
            return ProductMapper.toGrpcGetListProductsResponse([]);
        }

        try {
            this.logger.log(`[gRPC In - GetListProducts] Fetching products for IDs: ${JSON.stringify(productIdsToFetch)}`);
            const productEntitiesWithDetails: ProductEntity[] = await this.productsService.findProductsByIds(
                productIdsToFetch,
                {
                    includeFarm: true,
                    //includeSubcategoryDetails:false,
                   // includeCategory: false,
                    includeAddress: true,
                    includeAddressGhn: true,
                    includeIdentification: true, // Bật nếu cần thông tin identification
                }
            );

            if (!productEntitiesWithDetails || productEntitiesWithDetails.length === 0) {
            
                 this.logger.log('[gRPC Logic - GetListProducts] No products found for the given IDs.');
                return ProductMapper.toGrpcGetListProductsResponse([]);
            }

            const grpcProductResponseItems = productEntitiesWithDetails.map(pEntity => {
                const farmEntity = pEntity.farm;
                const addressEntity = farmEntity?.address; // Sử dụng optional chaining
                const identificationEntity = farmEntity?.identification;
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, Farm: ${farmEntity?.farm_id}`);
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, address: ${JSON.stringify(addressEntity, null, 2)}`);
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, identification: ${JSON.stringify(identificationEntity,null, 2)}`);
                
               
                return ProductMapper.toGrpcProductResponse(
                    pEntity,
                    farmEntity,
                );
            });

            const finalResponse = ProductMapper.toGrpcGetListProductsResponse(grpcProductResponseItems);
             this.logger.log(`[gRPC Out - GetListProducts] Successfully processed. Returning ${finalResponse.products_found.length} products.`);
            return finalResponse;

        } catch (error) {
            this.logger.error(`[gRPC In - GetListProducts] Error fetching products for IDs ${JSON.stringify(productIdsToFetch)}: ${error.message}`, error.stack);
            if (error instanceof RpcException) {
                throw error;
            }
            throw new RpcException(`Error processing GetListProducts request: ${error.message}`);
        }
    }

   
}
