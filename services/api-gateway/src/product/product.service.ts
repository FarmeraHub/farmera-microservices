import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ProductClientService } from './product.client.service';
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
} from './dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly productClientService: ProductClientService) {}

  // ==================== PRODUCT METHODS ====================

  async searchProducts(searchDto: SearchProductsDto) {
    this.logger.log(`Service: Searching products with filters`);

    try {
      const result = await firstValueFrom(
        this.productClientService.searchProducts({
          search: searchDto.search,
          category: searchDto.category,
          subcategory: searchDto.subcategory,
          min_price: searchDto.minPrice,
          max_price: searchDto.maxPrice,
          farm_id: searchDto.farmId,
          status: searchDto.status,
          page: searchDto.page,
          limit: searchDto.limit,
          sort_by: searchDto.sort_by,
          order: searchDto.order,
          all: searchDto.all,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error searching products: ${error.message}`);
      throw new BadRequestException('Failed to search products');
    }
  }

  async getProductById(id: number) {
    this.logger.log(`Service: Getting product with ID: ${id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getProduct(id),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting product: ${error.message}`);
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async createProduct(
    createProductDto: CreateProductDto,
    userId: string,
    files?: any,
  ) {
    this.logger.log(`Service: Creating product for user: ${userId}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.createProduct({
          ...createProductDto,
          user_id: userId,
          files,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating product: ${error.message}`);
      throw new BadRequestException('Failed to create product');
    }
  }

  // ==================== CATEGORY METHODS ====================

  async getAllCategories() {
    this.logger.log('Service: Getting all categories with subcategories');

    try {
      const result = await firstValueFrom(
        this.productClientService.getAllCategoryWithSubcategory(),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting categories: ${error.message}`);
      throw new BadRequestException('Failed to retrieve categories');
    }
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Service: Creating new category');

    try {
      const result = await firstValueFrom(
        this.productClientService.createCategory(createCategoryDto),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error creating category: ${error.message}`);
      throw new BadRequestException('Failed to create category');
    }
  }

  // ==================== FARM METHODS ====================

  async getFarms(farmFiltersDto: FarmFiltersDto) {
    this.logger.log('Service: Getting farms with filters');

    try {
      const result = await firstValueFrom(
        this.productClientService.listFarms({
          search: farmFiltersDto.search,
          status: farmFiltersDto.status,
          city: farmFiltersDto.city,
          page: farmFiltersDto.page,
          limit: farmFiltersDto.limit,
          sort_by: farmFiltersDto.sort_by,
          order: farmFiltersDto.order,
          all: farmFiltersDto.all,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Service error getting farms: ${error.message}`);
      throw new BadRequestException('Failed to retrieve farms');
    }
  }
}
