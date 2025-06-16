import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ProductClientService } from './product.client.service';
import {
  GetProductRequest,
  GetListProductsRequest,
  ProductRequest,
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductRequest,
  SearchProductsRequest,
  GetAllCategoryWithSubcategoryRequest,
  GetCategoryRequest,
  CreateCategoryRequest,
  GetSubcategoryRequest,
  CreateSubcategoryRequest,
  GetFarmRequest,
  GetFarmByUserRequest,
  CreateFarmRequest,
  UpdateFarmRequest,
  ListFarmsRequest,
  UpdateFarmStatusRequest,
} from '@farmera/grpc-proto/dist/products/products';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductsDto,
  CreateCategoryDto,
  CreateSubcategoryDto,
  RegisterFarmDto,
  UpdateFarmDto,
  FarmFiltersDto,
  UpdateFarmStatusDto,
  PaginationQueryDto,
} from './dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly productClientService: ProductClientService) {}

  // ==================== PRODUCT METHODS ====================

  async searchProducts(searchDto: SearchProductsDto) {
    this.logger.log('Service: Searching products with filters');

    try {
      const grpcRequest: SearchProductsRequest = {
        query: searchDto.search || '',
        pagination: {
          page: searchDto.page || 1,
          page_size: searchDto.limit || 10,
          offset: ((searchDto.page || 1) - 1) * (searchDto.limit || 10),
          limit: searchDto.limit || 10,
        },
        filters: [], // Can be extended based on searchDto
        location: undefined, // Can be added if needed
        max_distance_km: undefined,
      };

      const result = await firstValueFrom(
        this.productClientService.searchProducts(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error searching products: ${error.message}`);
      throw new BadRequestException('Failed to search products');
    }
  }

  async getProductById(productId: number) {
    this.logger.log(`Service: Getting product with ID: ${productId}`);

    try {
      const grpcRequest: GetProductRequest = {
        product_id: productId,
      };

      const result = await firstValueFrom(
        this.productClientService.getProduct(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting product: ${error.message}`);
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  async getProductsByIds(productIds: number[]) {
    this.logger.log(
      `Service: Getting products by IDs: ${productIds.join(', ')}`,
    );

    try {
      const grpcRequest: GetListProductsRequest = {
        products: productIds.map((id) => ({ product_id: id })),
      };

      const result = await firstValueFrom(
        this.productClientService.getListProducts(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Service error getting products by IDs: ${error.message}`,
      );
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  async createProduct(
    createProductDto: CreateProductDto,
    userId: string,
    files?: any,
  ) {
    this.logger.log(`Service: Creating product for user: ${userId}`);

    try {
      const grpcRequest: CreateProductRequest = {
        farm_id: '', // Should be provided from user's farm
        product_name: createProductDto.product_name,
        description: createProductDto.description || '',
        price_per_unit: {
          amount: createProductDto.price_per_unit,
          currency: 'VND',
        },
        unit: {
          name: createProductDto.unit,
          display_name: createProductDto.unit,
          symbol: createProductDto.unit,
          category: 'weight',
        },
        stock_quantity: createProductDto.stock_quantity,
        subcategory_ids: createProductDto.subcategory_ids || [],
        image_urls: files?.product_images?.map((file: any) => file.url) || [],
        video_urls: files?.product_videos?.map((file: any) => file.url) || [],
        is_organic: false, // Can be extended
        is_seasonal: false, // Can be extended
        harvest_date: undefined,
        expiry_date: undefined,
        tags: [],
        sku: '',
      };

      const result = await firstValueFrom(
        this.productClientService.createProduct(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating product: ${error.message}`);
      throw new BadRequestException('Failed to create product');
    }
  }

  async updateProduct(
    productId: number,
    updateProductDto: UpdateProductDto,
    userId: string,
    files?: any,
  ) {
    this.logger.log(`Service: Updating product with ID: ${productId}`);

    try {
      const grpcRequest: UpdateProductRequest = {
        product_id: productId,
        product_name: updateProductDto.product_name,
        description: updateProductDto.description,
        price_per_unit: updateProductDto.price_per_unit
          ? {
              amount: updateProductDto.price_per_unit,
              currency: 'VND',
            }
          : undefined,
        stock_quantity: updateProductDto.stock_quantity,
        image_urls:
          files?.product_images?.map((file: any) => file.url) ||
          updateProductDto.image_urls ||
          [],
        video_urls:
          files?.product_videos?.map((file: any) => file.url) ||
          updateProductDto.video_urls ||
          [],
        tags: [],
        is_organic: undefined,
        expiry_date: undefined,
      };

      const result = await firstValueFrom(
        this.productClientService.updateProduct(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error updating product: ${error.message}`);
      throw new BadRequestException('Failed to update product');
    }
  }

  async deleteProduct(productId: number, userId: string) {
    this.logger.log(`Service: Deleting product with ID: ${productId}`);

    try {
      const grpcRequest: DeleteProductRequest = {
        product_id: productId,
        reason: 'Deleted by user',
      };

      const result = await firstValueFrom(
        this.productClientService.deleteProduct(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error deleting product: ${error.message}`);
      throw new BadRequestException('Failed to delete product');
    }
  }

  // ==================== CATEGORY METHODS ====================

  async getAllCategories() {
    this.logger.log('Service: Getting all categories with subcategories');

    try {
      const grpcRequest: GetAllCategoryWithSubcategoryRequest = {};

      const result = await firstValueFrom(
        this.productClientService.getAllCategoryWithSubcategory(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting categories: ${error.message}`);
      throw new BadRequestException('Failed to retrieve categories');
    }
  }

  async getCategoryById(categoryId: number) {
    this.logger.log(`Service: Getting category with ID: ${categoryId}`);

    try {
      const grpcRequest: GetCategoryRequest = {
        category_id: categoryId,
        include_subcategories: true,
        include_product_count: true,
      };

      const result = await firstValueFrom(
        this.productClientService.getCategory(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting category: ${error.message}`);
      throw new BadRequestException('Failed to retrieve category');
    }
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Service: Creating new category');

    try {
      const grpcRequest: CreateCategoryRequest = {
        name: createCategoryDto.name,
        description: createCategoryDto.description || '',
        category_icon_data: new Uint8Array(), // Can be extended if needed
      };

      const result = await firstValueFrom(
        this.productClientService.createCategory(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating category: ${error.message}`);
      throw new BadRequestException('Failed to create category');
    }
  }

  async getSubcategoryById(subcategoryId: number) {
    this.logger.log(`Service: Getting subcategory with ID: ${subcategoryId}`);

    try {
      const grpcRequest: GetSubcategoryRequest = {
        subcategory_id: subcategoryId,
      };

      const result = await firstValueFrom(
        this.productClientService.getSubcategory(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting subcategory: ${error.message}`);
      throw new BadRequestException('Failed to retrieve subcategory');
    }
  }

  async createSubcategory(createSubcategoryDto: CreateSubcategoryDto) {
    this.logger.log('Service: Creating new subcategory');

    try {
      const grpcRequest: CreateSubcategoryRequest = {
        name: createSubcategoryDto.name,
        description: createSubcategoryDto.description,
        category_id: createSubcategoryDto.category_id,
      };

      const result = await firstValueFrom(
        this.productClientService.createSubcategory(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating subcategory: ${error.message}`);
      throw new BadRequestException('Failed to create subcategory');
    }
  }

  // ==================== FARM METHODS ====================

  async getFarms(farmFiltersDto: FarmFiltersDto) {
    this.logger.log('Service: Getting farms with filters');

    try {
      const grpcRequest: ListFarmsRequest = {
        pagination: {
          page: farmFiltersDto.page || 1,
          page_size: farmFiltersDto.limit || 10,
          offset:
            ((farmFiltersDto.page || 1) - 1) * (farmFiltersDto.limit || 10),
          limit: farmFiltersDto.limit || 10,
        },
        sort: [],
        verified_only: undefined,
        active_only: undefined,
        search_query: farmFiltersDto.search,
        location_filter: undefined,
      };

      const result = await firstValueFrom(
        this.productClientService.listFarms(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting farms: ${error.message}`);
      throw new BadRequestException('Failed to retrieve farms');
    }
  }

  async getFarmById(farmId: string, includeProducts: boolean = false) {
    this.logger.log(`Service: Getting farm with ID: ${farmId}`);

    try {
      const grpcRequest: GetFarmRequest = {
        farm_id: farmId,
        include_products: includeProducts,
      };

      const result = await firstValueFrom(
        this.productClientService.getFarm(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting farm: ${error.message}`);
      throw new BadRequestException('Failed to retrieve farm');
    }
  }

  async getFarmByUserId(userId: string, includeProducts: boolean = false) {
    this.logger.log(`Service: Getting farm for user: ${userId}`);

    try {
      const grpcRequest: GetFarmByUserRequest = {
        user_id: userId,
        include_products: includeProducts,
      };

      const result = await firstValueFrom(
        this.productClientService.getFarmByUser(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting farm: ${error.message}`);
      throw new BadRequestException('Failed to retrieve farm');
    }
  }

  async createFarm(
    registerFarmDto: RegisterFarmDto,
    userId: string,
    files?: any,
  ) {
    this.logger.log('Service: Creating new farm');

    try {
      const grpcRequest: CreateFarmRequest = {
        farm_name: registerFarmDto.farm_name,
        description: registerFarmDto.description || '',
        owner_id: userId,
        location: {
          id: '',
          user_id: userId,
          address_line: `${registerFarmDto.street}, ${registerFarmDto.ward}, ${registerFarmDto.district}, ${registerFarmDto.city}`,
          city: registerFarmDto.city,
          state: registerFarmDto.district,
          postal_code: '',
          country: 'VN',
          latitude: 0, // Should be parsed from coordinate
          longitude: 0, // Should be parsed from coordinate
          is_default: true,
          created_at: undefined,
          updated_at: undefined,
        },
        contact_info: {
          email: registerFarmDto.email,
          phone: registerFarmDto.phone,
          website: '',
          social_media: [],
        },
        certifications: [],
        operating_hours: [],
        established_date: undefined,
        license_number: registerFarmDto.tax_number || '',
        farm_size_hectares: 0,
        farming_methods: [],
      };

      const result = await firstValueFrom(
        this.productClientService.createFarm(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating farm: ${error.message}`);
      throw new BadRequestException('Failed to create farm');
    }
  }

  async updateFarm(
    farmId: string,
    updateFarmDto: UpdateFarmDto,
    userId: string,
    files?: any,
  ) {
    this.logger.log(`Service: Updating farm with ID: ${farmId}`);

    try {
      const grpcRequest: UpdateFarmRequest = {
        farm_id: farmId,
        farm_name: updateFarmDto.farm_name,
        description: updateFarmDto.description,
        contact_info:
          updateFarmDto.email || updateFarmDto.phone
            ? {
                email: updateFarmDto.email || '',
                phone: updateFarmDto.phone || '',
                website: '',
                social_media: [],
              }
            : undefined,
        operating_hours: [],
        farming_methods: [],
        image_urls: files?.profile_images?.map((file: any) => file.url) || [],
      };

      const result = await firstValueFrom(
        this.productClientService.updateFarm(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error updating farm: ${error.message}`);
      throw new BadRequestException('Failed to update farm');
    }
  }

  async updateFarmStatus(
    farmId: string,
    updateStatusDto: UpdateFarmStatusDto,
    userId: string,
  ) {
    this.logger.log(`Service: Updating farm status for farm: ${farmId}`);

    try {
      const grpcRequest: UpdateFarmStatusRequest = {
        farm_id: farmId,
        user_id: userId,
        status: updateStatusDto.status,
        reason: updateStatusDto.reason,
      };

      const result = await firstValueFrom(
        this.productClientService.updateFarmStatus(grpcRequest),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error updating farm status: ${error.message}`);
      throw new BadRequestException('Failed to update farm status');
    }
  }
}
