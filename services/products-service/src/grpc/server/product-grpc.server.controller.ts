import { FarmAdminService } from './../../admin/farm/farm-admin.service';
import { Product as ProductEntity } from './../../products/entities/product.entity';
import { Category } from './../../categories/entities/category.entity';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CategoriesService } from 'src/categories/categories.service';
import { FarmsService } from 'src/farms/farms.service';
import { ProductsService } from 'src/products/products.service';
import {
  ProductsServiceControllerMethods,
  ProductsServiceController,
  GetListProductsRequest,
  GetListProductsResponse,
  ProductRequest,
  ProductResponse,
  Product as GrpcProduct,
  Farm as GrpcFarm,
  GetProductRequest,
  GetProductResponse,
  GetAllCategoryWithSubcategoryResponse,
  ListCategoriesResponse,
  GetAllCategoryWithSubcategoryRequest,
  CreateCategoryRequest,
  CreateCategoryResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  CreateSubcategoryRequest,
  GetSubcategoryRequest,
  GetSubcategoryResponse,
  CreateSubcategoryResponse,
  GetFarmRequest,
  GetFarmResponse,
  GetFarmByUserRequest,
  UpdateFarmStatusRequest,
  UpdateFarmStatusResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  CreateFarmRequest,
  CreateFarmResponse,
  UpdateFarmRequest,
  UpdateFarmResponse,
  ListFarmsRequest,
  ListFarmsResponse,
} from '@farmera/grpc-proto/dist/products/products';
import { Observable, of, throwError, map, catchError, tap, from } from 'rxjs';

import { ProductMapper } from './mappers/product.mapper';
import { CreateSubcategoryDto } from 'src/categories/dto/request/create-subcategories.dto';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { r } from 'pinata/dist/index-CQFQEo3K';
import { UpdateFarmStatusDto } from 'src/admin/farm/dto/update-farm-status.dto';
import { FarmStatus } from 'src/common/enums/farm-status.enum';

@Controller()
@ProductsServiceControllerMethods()
export class ProductGrpcServerController implements ProductsServiceController {
  private readonly logger = new Logger(ProductGrpcServerController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly farmsService: FarmsService,
    private readonly categoriesService: CategoriesService,
    private readonly farmAdminService: FarmAdminService,
  ) {}
  async getProduct(request: GetProductRequest): Promise<GetProductResponse> {
    if (!request || !request.product_id) {
      this.logger.error(
        '[gRPC In - GetProduct] Invalid request: product_id is required.',
      );
      throw new RpcException('Invalid request: product_id is required.');
    }
    this.logger.log(
      `[gRPC In - GetProduct] Received request for product_id: ${request.product_id}`,
    );
    try {
      const productEntity = await this.productsService.findProductById(
        request.product_id,
        {
          includeFarm: true,
          includeSubcategoryDetails: true, // Bật nếu cần thông tin subcategory
          includeCategory: true, // Bật nếu cần thông tin category
          includeAddress: true, // Bật nếu cần thông tin address
          includeAddressGhn: true, // Bật nếu cần thông tin address GHN
        },
      );
      if (!productEntity) {
        this.logger.warn(
          `[gRPC Logic - GetProduct] No product found for ID: ${request.product_id}`,
        );
        throw new RpcException(
          `No product found for ID: ${request.product_id}`,
        );
      }
      this.logger.log(
        `[gRPC Logic - GetProduct] Successfully fetched product: ${productEntity.product_id}`,
      );
      const result = ProductMapper.toGrpcGetProductResponse(productEntity);
      this.logger.log(
        `[gRPC Out - GetProduct] Returning product: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[gRPC In - GetProduct] Error fetching product with ID ${request.product_id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException(
        `Error processing GetProduct request: ${error.message}`,
      );
    }
  }
  async getListProducts(
    request: GetListProductsRequest,
  ): Promise<GetListProductsResponse> {
    // this.logger.log(`[gRPC In - GetListProducts] Received request: ${JSON.stringify(request)}`);

    if (!request.products || request.products.length === 0) {
      // this.logger.log('[gRPC In - GetListProducts] Request "products_requested" array is empty. Returning empty list.');
      return ProductMapper.toGrpcGetListProductsResponse([]);
    }

    const productIdsToFetch: number[] = request.products
      .map((pReq) => pReq.product_id)
      .filter((id) => id !== undefined && id !== null); // Lọc ID hợp lệ

    if (productIdsToFetch.length === 0) {
      return ProductMapper.toGrpcGetListProductsResponse([]);
    }

    try {
      this.logger.log(
        `[gRPC In - GetListProducts] Fetching products for IDs: ${JSON.stringify(productIdsToFetch)}`,
      );
      const productEntitiesWithDetails: ProductEntity[] =
        await this.productsService.findProductsByIds(productIdsToFetch, {
          includeFarm: true,
          //includeSubcategoryDetails:false,
          // includeCategory: false,
          includeAddress: true,
          includeAddressGhn: true,
          includeIdentification: true, // Bật nếu cần thông tin identification
        });

      if (
        !productEntitiesWithDetails ||
        productEntitiesWithDetails.length === 0
      ) {
        this.logger.log(
          '[gRPC Logic - GetListProducts] No products found for the given IDs.',
        );
        return ProductMapper.toGrpcGetListProductsResponse([]);
      }

      const grpcProductResponseItems = productEntitiesWithDetails.map(
        (pEntity) => {
          const farmEntity = pEntity.farm;
          const addressEntity = farmEntity?.address; // Sử dụng optional chaining
          const identificationEntity = farmEntity?.identification;
          this.logger.log(
            `[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, Farm: ${farmEntity?.farm_id}`,
          );
          this.logger.log(
            `[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, address: ${JSON.stringify(addressEntity, null, 2)}`,
          );
          this.logger.log(
            `[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, identification: ${JSON.stringify(identificationEntity, null, 2)}`,
          );

          return ProductMapper.toGrpcProductResponse(pEntity, farmEntity);
        },
      );

      const finalResponse = ProductMapper.toGrpcGetListProductsResponse(
        grpcProductResponseItems,
      );
      this.logger.log(
        `[gRPC Out - GetListProducts] Successfully processed. Returning ${finalResponse.products_found.length} products.`,
      );
      return finalResponse;
    } catch (error) {
      this.logger.error(
        `[gRPC In - GetListProducts] Error fetching products for IDs ${JSON.stringify(productIdsToFetch)}: ${error.message}`,
        error.stack,
      );
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException(
        `Error processing GetListProducts request: ${error.message}`,
      );
    }
  }
  async getAllCategoryWithSubcategory(
    request: GetAllCategoryWithSubcategoryRequest,
  ): Promise<GetAllCategoryWithSubcategoryResponse> {
    const result =
      await this.categoriesService.getCategoriesWithSubcategories();

    // Handle both pagination and array results
    let categories: Category[];
    if (Array.isArray(result)) {
      categories = result;
    } else {
      categories = result.data;
    }

    if (!categories || categories.length === 0) {
      this.logger.warn(
        '[gRPC Logic - GetAllCategoryWithSubcategory] No categories found.',
      );
      return { categories: [], pagination: undefined };
    }
    this.logger.log(
      `[gRPC Logic - GetAllCategoryWithSubcategory] Successfully fetched ${categories.length} categories with subcategories.`,
    );
    const grpcResult =
      ProductMapper.toGrpcGetAllCategoryWithSubcategoryResponse(categories);
    this.logger.log(
      `[gRPC Out - GetAllCategoryWithSubcategory] Returning ${grpcResult.categories.length} categories.`,
    );
    return grpcResult;
  }
  async createCategory(
    request: CreateCategoryRequest,
  ): Promise<CreateCategoryResponse> {
    this.logger.log(
      `[gRPC In - CreateCategory] Received request to create category: ${JSON.stringify(request)}`,
    );
    if (!request || !request.name) {
      this.logger.error(
        '[gRPC In - CreateCategory] Invalid request: name is required.',
      );
      throw new RpcException('Invalid request: name is required.');
    }

    const categoryData =
      await this.categoriesService.createCategoryForGrpc(request);

    return categoryData;
  }
  async getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
    const category: any = await this.categoriesService.getCategoryById(
      request.category_id,
    );
    if (!category) {
      this.logger.warn(
        `[gRPC Logic - GetCategory] No category found for ID: ${request.category_id}`,
      );
      throw new RpcException(
        `No category found for ID: ${request.category_id}`,
      );
    }
    this.logger.log(
      `[gRPC Logic - GetCategory] Successfully fetched category: ${category.category_id}`,
    );
    const result = ProductMapper.toGrpcGetCategoryResponse(category);
    if (!result) {
      this.logger.warn(
        '[gRPC Logic - GetCategory] No category found after fetching.',
      );
      throw new RpcException('No category found after fetching.');
    }
    this.logger.log(
      `[gRPC Out - GetCategory] Returning category: ${JSON.stringify(result)}`,
    );
    return result;
  }
  async createSubcategory(
    request: CreateSubcategoryRequest,
  ): Promise<CreateSubcategoryResponse> {
    this.logger.log(
      `[gRPC In - CreateSubcategory] Received request to create subcategory: ${JSON.stringify(request)}`,
    );
    if (!request || !request.name || !request.category_id) {
      this.logger.error(
        '[gRPC In - CreateSubcategory] Invalid request: name and category_id are required.',
      );
      throw new RpcException(
        'Invalid request: name and category_id are required.',
      );
    }
    const req: CreateSubcategoryDto = {
      name: request.name,
      description: request.description || '',
      category_id: request.category_id,
    };
    const subcategory = await this.categoriesService.createSubcategory(req);
    if (!subcategory) {
      this.logger.warn(
        '[gRPC Logic - CreateSubcategory] Failed to create subcategory.',
      );
      throw new RpcException('Failed to create subcategory.');
    }
    this.logger.log(
      `[gRPC Logic - CreateSubcategory] Successfully created subcategory: ${subcategory.subcategory_id}`,
    );
    const result = ProductMapper.toGrpcCreateSubcategoryResponse(subcategory);
    if (!result) {
      this.logger.warn(
        '[gRPC Logic - CreateSubcategory] No subcategory found after creation.',
      );
      throw new RpcException('No subcategory found after creation.');
    }
    return result;
  }

  async getSubcategory(
    request: GetSubcategoryRequest,
  ): Promise<GetSubcategoryResponse> {
    this.logger.log(
      `[gRPC In - GetSubcategory] Received request for subcategory_id: ${request.subcategory_id}`,
    );
    if (!request || !request.subcategory_id) {
      this.logger.error(
        '[gRPC In - GetSubcategory] Invalid request: subcategory_id is required.',
      );
      throw new RpcException('Invalid request: subcategory_id is required.');
    }
    const subcategory = await this.categoriesService.getSubcategoryById(
      request.subcategory_id,
    );
    if (!subcategory) {
      this.logger.warn(
        `[gRPC Logic - GetSubcategory] No subcategory found for ID: ${request.subcategory_id}`,
      );
      throw new RpcException(
        `No subcategory found for ID: ${request.subcategory_id}`,
      );
    }
    this.logger.log(
      `[gRPC Logic - GetSubcategory] Successfully fetched subcategory: ${subcategory.subcategory_id}`,
    );
    const result = ProductMapper.toGrpcGetSubcategoryResponse(subcategory);
    this.logger.log(
      `[gRPC Out - GetSubcategory] Returning subcategory: ${JSON.stringify(result)}`,
    );
    if (!result) {
      this.logger.warn(
        '[gRPC Logic - GetSubcategory] No subcategory found after fetching.',
      );
      throw new RpcException('No subcategory found after fetching.');
    }
    return result;
  }

  //farm
  async getFarm(request: GetFarmRequest): Promise<GetFarmResponse> {
    this.logger.log(
      `[gRPC In - GetFarm] Received request for farm_id: ${request.farm_id}`,
    );

    if (!request || !request.farm_id) {
      this.logger.error(
        '[gRPC In - GetFarm] Invalid request: farm_id is required.',
      );
      throw new RpcException('Invalid request: farm_id is required.');
    }

    const farmEntity = await this.farmsService.findFarmById(request.farm_id);

    if (!farmEntity) {
      this.logger.warn(
        `[gRPC Logic - GetFarm] No farm found for ID: ${request.farm_id}`,
      );
      throw new RpcException(`No farm found for ID: ${request.farm_id}`);
    }

    let productEntities: ProductEntity[] = [];
    if (request.include_products) {
      this.logger.log(
        `[gRPC Logic - GetFarm] Including products for farm_id: ${request.farm_id}`,
      );
      productEntities = await this.productsService.findProductsByFarmId(
        request.farm_id,
      );
      this.logger.log(
        `[gRPC Logic - GetFarm] Found ${productEntities.length} products for farm_id: ${request.farm_id}`,
      );
    }
    this.logger.log(
      `[gRPC Logic - GetFarm] Successfully fetched farm: ${farmEntity.farm_id}`,
    );
    const response = ProductMapper.toGrpcGetFarmResponse(
      farmEntity,
      productEntities,
    );

    if (!response) {
      this.logger.warn(
        '[gRPC Logic - GetFarm] Failed to map farm entity to gRPC response.',
      );
      throw new RpcException('Failed to map farm entity to gRPC response.');
    }

    return response;
  }

  async getFarmByUser(request: GetFarmByUserRequest): Promise<GetFarmResponse> {
    this.logger.log(
      `[gRPC In - GetFarm] Received request for user_id: ${request.user_id}`,
    );

    if (!request || !request.user_id) {
      this.logger.error(
        '[gRPC In - GetFarm] Invalid request: farm_id is required.',
      );
      throw new RpcException('Invalid request: farm_id is required.');
    }

    const farmEntity = await this.farmsService.findByUserID(request.user_id);

    if (!farmEntity) {
      this.logger.warn(
        `[gRPC Logic - GetFarm] No farm found for user id: ${request.user_id}`,
      );
      throw new RpcException(`No farm found for User ID: ${request.user_id}`);
    }

    let productEntities: ProductEntity[] = [];
    if (request.include_products) {
      this.logger.log(
        `[gRPC Logic - GetFarm] Including products for farm_id: ${farmEntity.farm_id}`,
      );
      productEntities = await this.productsService.findProductsByFarmId(
        farmEntity.farm_id,
      );
      this.logger.log(
        `[gRPC Logic - GetFarm] Found ${productEntities.length} products for farm_id: ${farmEntity.farm_id}`,
      );
    }
    this.logger.log(
      `[gRPC Logic - GetFarm] Successfully fetched farm: ${farmEntity.farm_id}`,
    );
    const response = ProductMapper.toGrpcGetFarmByUserResponse(
      farmEntity,
      productEntities,
    );

    if (!response) {
      this.logger.warn(
        '[gRPC Logic - GetFarm] Failed to map farm entity to gRPC response.',
      );
      throw new RpcException('Failed to map farm entity to gRPC response.');
    }

    return response;
  }

  async updateFarmStatus(
    request: UpdateFarmStatusRequest,
  ): Promise<UpdateFarmStatusResponse> {
    this.logger.log(
      `[gRPC In - UpdateFarmStatus] Received request to update farm status: ${JSON.stringify(request)}`,
    );

    if (!request || !request.farm_id || !request.status) {
      this.logger.error(
        '[gRPC In - UpdateFarmStatus] Invalid request: farm_id and status are required.',
      );
      throw new RpcException(
        'Invalid request: farm_id and status are required.',
      );
    }

    try {
      this.logger.log(
        `[gRPC Logic - UpdateFarmStatus] Updating farm status for farm_id: ${request.farm_id} to status: ${request.status}`,
      );
      const updateDto: UpdateFarmStatusDto = {
        status: FarmStatus[request.status],
        reason: request.reason || '',
      };
      const updatedFarm = await this.farmAdminService.updateFarmStatus(
        request.farm_id,
        updateDto,
        request.user_id,
      );
      this.logger.log(
        `[gRPC Logic - UpdateFarmStatus] Successfully updated farm status for farm_id: ${updatedFarm.farm_id}`,
      );
      const farm =
        ProductMapper.toGrpcUpdateFarmStatusStatusResponse(updatedFarm);
      if (!farm) {
        this.logger.warn(
          '[gRPC Logic - UpdateFarmStatus] Failed to map updated farm entity to gRPC response.',
        );
        throw new RpcException(
          'Failed to map updated farm entity to gRPC response.',
        );
      }
      return farm;
    } catch (error) {
      this.logger.error(
        `[gRPC Logic - UpdateFarmStatus] Error updating farm status for farm_id ${request.farm_id}: ${error.message}`,
        error.stack,
      );
      throw new RpcException(
        `Error processing UpdateFarmStatus request: ${error.message}`,
      );
    }
  }

  // NOTE: The following methods are temporarily commented out until proper service methods are implemented
  // They require additional service layer implementation and mapper methods

  async createProduct(
    request: CreateProductRequest,
  ): Promise<CreateProductResponse> {
    throw new RpcException(
      'CreateProduct method not yet implemented - requires service layer implementation',
    );
  }

  async updateProduct(
    request: UpdateProductRequest,
  ): Promise<UpdateProductResponse> {
    throw new RpcException(
      'UpdateProduct method not yet implemented - requires service layer implementation',
    );
  }

  async deleteProduct(
    request: DeleteProductRequest,
  ): Promise<DeleteProductResponse> {
    throw new RpcException(
      'DeleteProduct method not yet implemented - requires service layer implementation',
    );
  }

  async searchProducts(
    request: SearchProductsRequest,
  ): Promise<SearchProductsResponse> {
    this.logger.log(
      `[gRPC In - SearchProducts] Received search request: ${JSON.stringify(request)}`,
    );

    try {
      // Convert gRPC pagination to service pagination
      const { PaginationOptions } = await import(
        'src/pagination/dto/pagination-options.dto'
      );
      const paginationOptions = Object.assign(new PaginationOptions(), {
        page: request.pagination?.page || 1,
        limit: request.pagination?.page_size || 10,
        all: false,
      });

      // Extract filters from request
      const filters = {
        search: request.query || undefined,
        // Add other filters as needed based on the request structure
      };

      const result = await this.productsService.searchAndFilterProducts(
        paginationOptions,
        filters,
      );

      this.logger.log(
        `[gRPC Logic - SearchProducts] Found ${result.data.length} products`,
      );

      // Convert result to gRPC Product entities
      const grpcProducts = await Promise.all(
        result.data.map(async (productDto) => {
          // Convert ResponseProductDto back to Product entity for mapping
          const productEntity = await this.productsService.findProductById(
            Number(productDto.product_id),
            { includeFarm: true },
          );
          return productEntity
            ? ProductMapper.toGrpcProduct(productEntity)
            : null;
        }),
      );

      return {
        products: grpcProducts.filter(
          (p): p is NonNullable<typeof p> => p !== null,
        ),
        pagination: {
          current_page: result.meta.page,
          page_size: result.meta.limit,
          total_items: result.meta.totalItems,
          total_pages: result.meta.totalPages,
          has_next_page: result.meta.hasNextPage,
          has_previous_page: result.meta.hasPreviousPage,
          next_cursor: '',
          previous_cursor: '',
        },
        suggested_queries: [],
      };
    } catch (error) {
      this.logger.error(
        `[gRPC Logic - SearchProducts] Error searching products: ${error.message}`,
        error.stack,
      );
      throw new RpcException(
        `Error processing SearchProducts request: ${error.message}`,
      );
    }
  }

  async createFarm(request: CreateFarmRequest): Promise<CreateFarmResponse> {
    throw new RpcException(
      'CreateFarm method not yet implemented - requires service layer implementation',
    );
  }

  async updateFarm(request: UpdateFarmRequest): Promise<UpdateFarmResponse> {
    throw new RpcException(
      'UpdateFarm method not yet implemented - requires service layer implementation',
    );
  }

  async listFarms(request: ListFarmsRequest): Promise<ListFarmsResponse> {
    this.logger.log(
      `[gRPC In - ListFarms] Received list farms request: ${JSON.stringify(request)}`,
    );

    try {
      // Convert gRPC pagination to service pagination
      const { PaginationOptions } = await import(
        'src/pagination/dto/pagination-options.dto'
      );
      const paginationOptions = Object.assign(new PaginationOptions(), {
        page: request.pagination?.page || 1,
        limit: request.pagination?.page_size || 10,
        all: false,
      });

      // Use the existing getAllFarms method with pagination
      const result = await this.farmsService.getAllFarms(paginationOptions);

      this.logger.log(
        `[gRPC Logic - ListFarms] Found farms, processing response`,
      );

      // Handle both paginated and non-paginated results
      let farms: any[];
      let meta: any;

      if (Array.isArray(result)) {
        // Non-paginated result
        farms = result;
        meta = {
          page: 1,
          limit: farms.length,
          totalItems: farms.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      } else {
        // Paginated result
        farms = result.data;
        meta = result.meta;
      }

      // Convert farms to gRPC format
      const grpcFarms = farms
        .map((farm) => ProductMapper.toGrpcFarm(farm))
        .filter(
          (f): f is NonNullable<typeof f> => f !== null && f !== undefined,
        );

      return {
        farms: grpcFarms,
        pagination: {
          current_page: meta.page,
          page_size: meta.limit,
          total_items: meta.totalItems,
          total_pages: meta.totalPages,
          has_next_page: meta.hasNextPage,
          has_previous_page: meta.hasPreviousPage,
          next_cursor: '',
          previous_cursor: '',
        },
      };
    } catch (error) {
      this.logger.error(
        `[gRPC Logic - ListFarms] Error listing farms: ${error.message}`,
        error.stack,
      );
      throw new RpcException(
        `Error processing ListFarms request: ${error.message}`,
      );
    }
  }
}
