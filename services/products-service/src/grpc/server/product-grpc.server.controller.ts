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
import { from, of, throwError, map, catchError, tap, Observable } from 'rxjs';

import { ProductMapper } from './mappers/product.mapper';

@Controller('grpc/products')
@ProductsServiceControllerMethods()
export class ProductGrpcServerController implements ProductsServiceController {
    private readonly logger = new Logger(ProductGrpcServerController.name);

    constructor(
        private readonly productsService: ProductsService,
        private readonly farmsService: FarmsService,
        private readonly categoriesService: CategoriesService,
    ) { }
    getListProducts(
        request: GetListProductsRequest,
    ): Observable<GetListProductsResponse> {
        this.logger.log(`[gRPC In - getListProducts] Received request: ${JSON.stringify(request, null, 2)}`);

        // --- Bước 1: Validate input và xử lý các trường hợp đơn giản ---
        if (!request || !request.products || !Array.isArray(request.products)) {
            this.logger.error('[gRPC In - getListProducts] Invalid request format: "products" array is missing or not an array.');
            // Trả về Observable lỗi ngay lập tức
            return throwError(() => new RpcException('Invalid request format: "products" array is required.'));
        }

        const emptyResponse: GetListProductsResponse = { products: [] };

        if (request.products.length === 0) {
            this.logger.log('[gRPC In - getListProducts] Request "products" array is empty. Returning empty list.');
            return of(emptyResponse); // Trả về Observable với response rỗng
        }

        const productIdsToFetch: number[] = request.products
            .filter(productReq => productReq.productId !== undefined && productReq.productId !== null)
            .map(productReq => productReq.productId);

        if (productIdsToFetch.length === 0) {
            this.logger.log('[gRPC In - getListProducts] No valid product IDs to fetch after filtering. Returning empty list.');
            return of(emptyResponse);
        }

        // --- Bước 2: Gọi service và xử lý kết quả bằng RxJS ---
        this.logger.log(`[gRPC Logic - getListProducts] Calling productsService.findProductsByIds with IDs: ${JSON.stringify(productIdsToFetch)}`);

        // Chuyển Promise từ service thành Observable
        return from(
            this.productsService.findProductsByIds(productIdsToFetch, {
                includeFarm: true,
                includeSubcategoryDetails: false, // Xem xét lại các tùy chọn này
                includeCategory: false,
                includeAddress: true,
                includeAddressGhn: true,
            })
        ).pipe(
            // `map` sẽ được thực thi khi Promise từ `findProductsByIds` resolve thành công
            map((productEntities: ProductEntity[]) => {
                this.logger.log(`[gRPC Logic - getListProducts] Fetched ${productEntities.length} product entities from service.`);

                // Gọi hàm mapper của bạn để chuyển đổi ProductEntity[] sang GetListProductsResponse
                // Giả sử ProductMapper.mapProductEntityListToFullGrpcResponse đã được tạo (như ví dụ trước)
                // hoặc bạn có thể dùng chuỗi map như:
                // const productResponses = ProductMapper.mapProductEntityListToProductResponseList(productEntities);
                // return ProductMapper.createGrpcGetListProductsResponse(productResponses);
                const finalResponse = ProductMapper.toGrpcGetListProductsResponse(productEntities);
                return finalResponse;
            }),
            // `tap` để log kết quả cuối cùng trước khi trả về
            tap(response => {
                this.logger.log(`[gRPC Out - getListProducts] Successfully processed. Returning ${response.products.length} product responses.`);
            }),
            // `catchError` để xử lý lỗi từ Promise hoặc từ các operator trong pipe
            catchError(error => {
                this.logger.error(`[gRPC Error - getListProducts] Error fetching/mapping products for IDs ${JSON.stringify(productIdsToFetch)}: ${error.message}`, error.stack);
                // Ném RpcException để client gRPC nhận được lỗi chuẩn
                // throwError tạo một Observable mới phát ra lỗi
                return throwError(() => new RpcException(`Error processing product list request: ${error.message}`));
            })
        );
    }

    // @GrpcMethod('ProductsService', 'GetListProducts')
    // async GetListProducts(
    //     request: ListProductsDtoGrpcRequest,
    // ): Promise<ListProductsDtoGrpcResponse> {
    //     this.logger.log(`[gRPC In - GetListProducts] Received request: ${JSON.stringify(request, null, 2)}`);
    //     if (!request || !request.products || !Array.isArray(request.products)) {
    //         this.logger.error('[gRPC In - GetListProducts] Invalid request format: "products" array is missing or not an array.');
    //         throw new RpcException('Invalid request format: "products" array is required.');
    //     }
    //     const mappedProductsResponse: ListProductsDtoGrpcResponse = {
    //         products: []
    //     };
    //     if (request.products.length === 0) {
    //         this.logger.log('[gRPC In - GetListProducts] Request "products" array is empty. Returning empty list.');
    //         return mappedProductsResponse;
    //     }

    //     const productIdsToFetch: number[] = [];
    //     for (const productInput of request.products) {
    //         if (productInput.product_id !== undefined && productInput.product_id !== null) {
    //             productIdsToFetch.push((productInput.product_id));
    //         } else {
    //             this.logger.warn(`[gRPC In - GetListProducts] Skipping product input due to missing product_id: ${JSON.stringify(productInput)}`);
    //         }
    //     }

    //     if (productIdsToFetch.length === 0) {
    //         this.logger.log('[gRPC In - GetListProducts] No valid product IDs to fetch after filtering. Returning empty list.');
    //         return mappedProductsResponse;
    //     }

    //     try {
    //         const productDtos: Product[] = await this.productsService.findProductsByIds(
    //             productIdsToFetch, {
    //             includeFarm: true,
    //             includeSubcategoryDetails: false,
    //             includeCategory: false,
    //             includeAddress: true,    // Bật nếu ProductMapper và ResponseFarmDto xử lý
    //             includeAddressGhn: true,
    //         }
    //         );
    //         this.logger.log(`[gRPC In - GetListProducts] Fetched ${productDtos.length} products for IDs: ${JSON.stringify(productIdsToFetch)}`);
    //         this.logger.log(`[gRPC In - GetListProducts] Product DTOs: ${JSON.stringify(productDtos, null, 2)}`);
    //         if (productDtos && productDtos.length > 0) {
    //             mappedProductsResponse.products = ProductMapper.toGrpcListProducts(productDtos);
    //         } else {
    //             this.logger.log(`[gRPC In - GetListProducts] No products found for the given IDs: ${JSON.stringify(productIdsToFetch)}.`);
    //         }

    //     } catch (error) {
    //         this.logger.error(`[gRPC In - GetListProducts] Error fetching products for IDs ${JSON.stringify(productIdsToFetch)}: ${error.message}`, error.stack);
    //         throw new RpcException(`Error processing product list request: ${error.message}`);
    //     }

    //     this.logger.log(`[gRPC In - GetListProducts] Successfully processed. Found ${mappedProductsResponse.products.length} products.`);
    //     this.logger.log(`[gRPC Out - GetListProducts] Returning response: ${JSON.stringify(mappedProductsResponse, null, 2)}`);
    //     return mappedProductsResponse;
    // }
}
