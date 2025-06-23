// payment-service/src/grpc/client/payment-grpc.client.service.ts
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ClientGrpc, RpcException } from "@nestjs/microservices";
import { IProductsGrpcService } from "./interface/product-info-service.interface";
import {
    ProductRequest as GrpcProductRequest,
    GetListProductsRequest as GrpcGetListProductsRequest,
    GetListProductsResponse as GrpcGetListProductsResponse,
    ProductResponse as GrpcProductResponse,
 } from "@farmera/grpc-proto/dist/products/products";
import { firstValueFrom } from "rxjs";




@Injectable()
export class PaymentGrpcClientService implements OnModuleInit {
    private readonly logger = new Logger(PaymentGrpcClientService.name);
    private productsServiceGrpcClient: IProductsGrpcService;

    constructor(
        @Inject('PRODUCTS_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) { }

    onModuleInit() {
        this.logger.log('PaymentGrpcClientService onModuleInit called.');
        this.productsServiceGrpcClient = this.clientGrpcInstance.getService<IProductsGrpcService>('ProductsService');
        if (!this.productsServiceGrpcClient) {
            this.logger.error('Failed to get ProductsService gRPC client on module init.');
            throw new Error('Critical: ProductsService gRPC client could not be initialized.');
        } else {
            this.logger.log('ProductsService gRPC client initialized successfully.');
        }
    }

//    async getListProducts(
//         requestData: GrpcGetListProductsRequest
//     ): Promise<GrpcGetListProductsResponse> {
//         this.logger.log(`[PaymentService Client - GetListProducts] Sending request to ProductsService: ${JSON.stringify(requestData, null, 2)}`);

//         if (!this.productsServiceGrpcClient) {
//             this.logger.error('ProductsService gRPC client is not initialized. Cannot call getListProducts.');
//             throw new RpcException('Internal Server Error: Products gRPC client not available.');
//         }

//         try {
//             const responseObservable = this.productsServiceGrpcClient.getListProducts(requestData);
//             const response = await firstValueFrom(responseObservable);

//             this.logger.log(`[PaymentService Client - GetListProducts] Received response from ProductsService: ${JSON.stringify(response)}`);
//             return response;

//         } catch (error) {
//             this.logger.error(`[PaymentService Client - GetListProducts] Error calling ProductsService: ${error.message}`, error.stack);
//             if (error instanceof RpcException) {
//                 throw error;
//             }

//             let errorMessage = `Failed to fetch products from ProductsService: ${error.message}`;
//             if (error && typeof error === 'object' && 'details' in error) {
//                 errorMessage = (error as any).details || error.message;
//             }
//             throw new RpcException(errorMessage);
//         }
    //     }
    
    async 
}