import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
    GetProductRequest,
    GetProductResponse,
    ProductsServiceClient,
    CreateCategoryRequest,
    CreateCategoryResponse,
    GetCategoryRequest,
    GetCategoryResponse,
    CreateSubcategoryRequest,
    CreateSubcategoryResponse,
    GetSubcategoryResponse,
    GetSubcategoryRequest,
} from "@farmera/grpc-proto/dist/products/products";
import { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ProductClientService implements OnModuleInit {
    private readonly logger = new Logger(ProductClientService.name);
    private productsServiceGrpcClient: ProductsServiceClient;

    constructor(
        @Inject('PRODUCTS_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) { }

    onModuleInit() {
        this.logger.log('ProductClientService onModuleInit called.');
        this.productsServiceGrpcClient = this.clientGrpcInstance.getService<ProductsServiceClient>('ProductsService');
        if (!this.productsServiceGrpcClient) {
            this.logger.error('Failed to get ProductsService gRPC client on module init.');
            throw new Error('Critical: ProductsService gRPC client could not be initialized.');
        } else {
            this.logger.log('ProductsService gRPC client initialized successfully.');
        }
    }
    async GetProduct(request: GetProductRequest): Promise<GetProductResponse>{
        const result = await firstValueFrom(this.productsServiceGrpcClient.getProduct(request));
        return result;
    }
    async GetAllCategoryWithSubcategory(): Promise<any> {
        this.logger.log('Fetching all categories with subcategories...');
        try {
            const result = await firstValueFrom(this.productsServiceGrpcClient.getAllCategoryWithSubcategory({}));
            this.logger.log('Successfully fetched all categories with subcategories.');
            return result;
        } catch (error) {
            this.logger.error('Error fetching all categories with subcategories:', error);
            throw error;
        }
    }
    async CreateCategory(CreateCategoryRequest: CreateCategoryRequest) : Promise<CreateCategoryResponse> {
        this.logger.log('Creating category with request:', CreateCategoryRequest);
        try {
            const result = await firstValueFrom(this.productsServiceGrpcClient.createCategory(CreateCategoryRequest));
            this.logger.log('Successfully created category:', result);
            return result;
        } catch (error) {
            this.logger.error('Error creating category:', error);
            throw error;
        }
    }
    async GetCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
        this.logger.log('Fetching category with request:', request);
        try {
            const result = await firstValueFrom(this.productsServiceGrpcClient.getCategory(request));
            this.logger.log('Successfully fetched category:', result);
            return result;
        } catch (error) {
            this.logger.error('Error fetching category:', error);
            throw error;
        }
    }
    async GetSubcategory(request: GetSubcategoryRequest): Promise<GetSubcategoryResponse> {
        this.logger.log('Fetching subcategory with request:', request);
        try {
            const result = await firstValueFrom(this.productsServiceGrpcClient.getSubcategory(request));
            this.logger.log('Successfully fetched subcategory:', result);
            return result;
        } catch (error) {
            this.logger.error('Error fetching subcategory:', error);
            throw error;
        }
    }
    async CreateSubcategory(request: CreateSubcategoryRequest): Promise<CreateSubcategoryResponse> {
        this.logger.log('Creating subcategory with request:', request);
        try {
            const result = await firstValueFrom(this.productsServiceGrpcClient.createSubcategory(request));
            this.logger.log('Successfully created subcategory:', result);
            return result;
        } catch (error) {
            this.logger.error('Error creating subcategory:', error);
            throw error;
        }
    }
}