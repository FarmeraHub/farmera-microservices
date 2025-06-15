import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

// gRPC method interfaces for Products Service
interface ProductsGrpcService {
  // Products
  getProduct(data: any): Observable<any>;
  getListProducts(data: any): Observable<any>;
  createProduct(data: any): Observable<any>;
  updateProduct(data: any): Observable<any>;
  deleteProduct(data: any): Observable<any>;
  searchProducts(data: any): Observable<any>;

  // Categories
  getAllCategoryWithSubcategory(data: any): Observable<any>;
  getCategory(data: any): Observable<any>;
  createCategory(data: any): Observable<any>;
  getSubcategory(data: any): Observable<any>;
  createSubcategory(data: any): Observable<any>;

  // Farms
  getFarm(data: any): Observable<any>;
  getFarmByUser(data: any): Observable<any>;
  createFarm(data: any): Observable<any>;
  updateFarm(data: any): Observable<any>;
  listFarms(data: any): Observable<any>;

  // Admin
  updateFarmStatus(data: any): Observable<any>;
}

@Injectable()
export class ProductClientService implements OnModuleInit {
  private readonly logger = new Logger(ProductClientService.name);
  private productsServiceGrpcClient: ProductsGrpcService;

  constructor(
    @Inject('PRODUCTS_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productsServiceGrpcClient =
      this.clientGrpcInstance.getService<ProductsGrpcService>(
        'ProductsService',
      );
    this.logger.log('ProductClientService initialized with gRPC client');
  }

  // Product methods
  getProduct(productId: number): Observable<any> {
    this.logger.log(`Getting product with ID: ${productId}`);
    return this.productsServiceGrpcClient.getProduct({ product_id: productId });
  }

  getListProducts(productIds: number[]): Observable<any> {
    this.logger.log(`Getting products with IDs: ${productIds.join(', ')}`);
    const products = productIds.map((id) => ({ product_id: id }));
    return this.productsServiceGrpcClient.getListProducts({ products });
  }

  createProduct(productData: any): Observable<any> {
    this.logger.log('Creating new product');
    return this.productsServiceGrpcClient.createProduct(productData);
  }

  updateProduct(productId: number, productData: any): Observable<any> {
    this.logger.log(`Updating product with ID: ${productId}`);
    return this.productsServiceGrpcClient.updateProduct({
      product_id: productId,
      ...productData,
    });
  }

  deleteProduct(productId: number, userId: string): Observable<any> {
    this.logger.log(`Deleting product with ID: ${productId}`);
    return this.productsServiceGrpcClient.deleteProduct({
      product_id: productId,
      user_id: userId,
    });
  }

  searchProducts(searchParams: any): Observable<any> {
    this.logger.log('Searching products with filters');
    return this.productsServiceGrpcClient.searchProducts(searchParams);
  }

  // Category methods
  getAllCategoryWithSubcategory(): Observable<any> {
    this.logger.log('Getting all categories with subcategories');
    return this.productsServiceGrpcClient.getAllCategoryWithSubcategory({});
  }

  getCategory(categoryId: number): Observable<any> {
    this.logger.log(`Getting category with ID: ${categoryId}`);
    return this.productsServiceGrpcClient.getCategory({
      category_id: categoryId,
    });
  }

  createCategory(categoryData: any): Observable<any> {
    this.logger.log('Creating new category');
    return this.productsServiceGrpcClient.createCategory(categoryData);
  }

  getSubcategory(subcategoryId: number): Observable<any> {
    this.logger.log(`Getting subcategory with ID: ${subcategoryId}`);
    return this.productsServiceGrpcClient.getSubcategory({
      subcategory_id: subcategoryId,
    });
  }

  createSubcategory(subcategoryData: any): Observable<any> {
    this.logger.log('Creating new subcategory');
    return this.productsServiceGrpcClient.createSubcategory(subcategoryData);
  }

  // Farm methods
  getFarm(farmId: string, includeProducts: boolean = false): Observable<any> {
    this.logger.log(`Getting farm with ID: ${farmId}`);
    return this.productsServiceGrpcClient.getFarm({
      farm_id: farmId,
      include_products: includeProducts,
    });
  }

  getFarmByUser(
    userId: string,
    includeProducts: boolean = false,
  ): Observable<any> {
    this.logger.log(`Getting farm for user: ${userId}`);
    return this.productsServiceGrpcClient.getFarmByUser({
      user_id: userId,
      include_products: includeProducts,
    });
  }

  createFarm(farmData: any): Observable<any> {
    this.logger.log('Creating new farm');
    return this.productsServiceGrpcClient.createFarm(farmData);
  }

  updateFarm(farmId: string, farmData: any): Observable<any> {
    this.logger.log(`Updating farm with ID: ${farmId}`);
    return this.productsServiceGrpcClient.updateFarm({
      farm_id: farmId,
      ...farmData,
    });
  }

  listFarms(filters: any): Observable<any> {
    this.logger.log('Listing farms with filters');
    return this.productsServiceGrpcClient.listFarms(filters);
  }

  // Admin methods
  updateFarmStatus(
    farmId: string,
    status: string,
    reason: string,
    userId: string,
  ): Observable<any> {
    this.logger.log(`Updating farm status for farm: ${farmId}`);
    return this.productsServiceGrpcClient.updateFarmStatus({
      farm_id: farmId,
      status,
      reason,
      user_id: userId,
    });
  }
}
