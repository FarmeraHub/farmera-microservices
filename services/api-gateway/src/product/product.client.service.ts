import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  ProductsServiceClient,
  GetProductRequest,
  GetProductResponse,
  GetListProductsRequest,
  GetListProductsResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetSubcategoryRequest,
  GetSubcategoryResponse,
  CreateSubcategoryRequest,
  CreateSubcategoryResponse,
  GetFarmRequest,
  GetFarmResponse,
  GetFarmByUserRequest,
  GetFarmByUserResponse,
  CreateFarmRequest,
  CreateFarmResponse,
  UpdateFarmRequest,
  UpdateFarmResponse,
  ListFarmsRequest,
  ListFarmsResponse,
  UpdateFarmStatusRequest,
  UpdateFarmStatusResponse,
} from '@farmera/grpc-proto/dist/products/products';

@Injectable()
export class ProductClientService implements OnModuleInit {
  private readonly logger = new Logger(ProductClientService.name);
  private productsServiceGrpcClient: ProductsServiceClient;

  constructor(
    @Inject('PRODUCTS_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
  ) { }

  onModuleInit() {
    this.productsServiceGrpcClient =
      this.clientGrpcInstance.getService<ProductsServiceClient>(
        'ProductsService',
      );
    this.logger.log('ProductClientService initialized with gRPC client');
  }

  // Product methods
  getProduct(request: GetProductRequest): Observable<GetProductResponse> {
    this.logger.log(`Getting product with ID: ${request.product_id}`);
    return this.productsServiceGrpcClient.getProduct(request);
  }

  getListProducts(
    request: GetListProductsRequest,
  ): Observable<GetListProductsResponse> {
    this.logger.log(
      `Getting products with IDs: ${request.products.map((p) => p.product_id).join(', ')}`,
    );
    return this.productsServiceGrpcClient.getListProducts(request);
  }

  createProduct(
    request: CreateProductRequest,
  ): Observable<CreateProductResponse> {
    this.logger.log('Creating new product');
    return this.productsServiceGrpcClient.createProduct(request);
  }

  updateProduct(
    request: UpdateProductRequest,
  ): Observable<UpdateProductResponse> {
    this.logger.log(`Updating product with ID: ${request.product_id}`);
    return this.productsServiceGrpcClient.updateProduct(request);
  }

  deleteProduct(
    request: DeleteProductRequest,
  ): Observable<DeleteProductResponse> {
    this.logger.log(`Deleting product with ID: ${request.product_id}`);
    return this.productsServiceGrpcClient.deleteProduct(request);
  }

  searchProducts(
    request: SearchProductsRequest,
  ): Observable<SearchProductsResponse> {
    this.logger.log('Searching products with filters');
    return this.productsServiceGrpcClient.searchProducts(request);
  }

  // Category methods
  getCategory(request: GetCategoryRequest): Observable<GetCategoryResponse> {
    this.logger.log(`Getting category with ID: ${request.category_id}`);
    return this.productsServiceGrpcClient.getCategory(request);
  }

  createCategory(
    request: CreateCategoryRequest,
  ): Observable<CreateCategoryResponse> {
    this.logger.log('Creating new category');
    return this.productsServiceGrpcClient.createCategory(request);
  }

  getSubcategory(
    request: GetSubcategoryRequest,
  ): Observable<GetSubcategoryResponse> {
    this.logger.log(`Getting subcategory with ID: ${request.subcategory_id}`);
    return this.productsServiceGrpcClient.getSubcategory(request);
  }

  createSubcategory(
    request: CreateSubcategoryRequest,
  ): Observable<CreateSubcategoryResponse> {
    this.logger.log('Creating new subcategory');
    return this.productsServiceGrpcClient.createSubcategory(request);
  }

  // Farm methods
  getFarm(request: GetFarmRequest): Observable<GetFarmResponse> {
    this.logger.log(`Getting farm with ID: ${request.farm_id}`);
    return this.productsServiceGrpcClient.getFarm(request);
  }

  getFarmByUser(
    request: GetFarmByUserRequest,
  ): Observable<GetFarmByUserResponse> {
    this.logger.log(`Getting farm for user: ${request.user_id}`);
    return this.productsServiceGrpcClient.getFarmByUser(request);
  }

  createFarm(request: CreateFarmRequest): Observable<CreateFarmResponse> {
    this.logger.log('Creating new farm');
    return this.productsServiceGrpcClient.createFarm(request);
  }

  updateFarm(request: UpdateFarmRequest): Observable<UpdateFarmResponse> {
    this.logger.log(`Updating farm with ID: ${request.farm_id}`);
    return this.productsServiceGrpcClient.updateFarm(request);
  }

  listFarms(request: ListFarmsRequest): Observable<ListFarmsResponse> {
    this.logger.log('Listing farms with filters');
    return this.productsServiceGrpcClient.listFarms(request);
  }

  // Admin methods
  updateFarmStatus(
    request: UpdateFarmStatusRequest,
  ): Observable<UpdateFarmStatusResponse> {
    this.logger.log(`Updating farm status for farm: ${request.farm_id}`);
    return this.productsServiceGrpcClient.updateFarmStatus(request);
  }
}
