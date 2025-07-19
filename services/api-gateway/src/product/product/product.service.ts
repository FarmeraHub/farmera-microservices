import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { firstValueFrom } from 'rxjs';
import { Product } from './entities/product.entity';
import { ProductMapper } from 'src/mappers/product/product.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { ProductOptions } from './dto/product-options.dto';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { GetProductByFarmDto } from './dto/get-by-farm.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { EnumMapper } from 'src/mappers/common/enum.mapper';
import { ProductStatus } from 'src/common/enums/product/product-status.enum';
import { ActivateBlockchainDto } from './dto/activate-blockchain.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private productGrpcService: ProductsServiceClient;

  constructor(@Inject('PRODUCTS_PACKAGE') private client: ClientGrpc) { }

  onModuleInit() {
    this.productGrpcService =
      this.client.getService<ProductsServiceClient>('ProductsService');
  }

  async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createProduct({
          user_id: userId,
          product_name: createProductDto.product_name,
          description: createProductDto.description,
          price_per_unit: createProductDto.price_per_unit,
          unit: createProductDto.unit,
          stock_quantity: createProductDto.stock_quantity,
          weight: createProductDto.weight,
          image_urls: createProductDto.image_urls
            ? { list: createProductDto.image_urls }
            : undefined,
          video_urls: createProductDto.video_urls
            ? { list: createProductDto.video_urls }
            : undefined,
          subcategory_ids: createProductDto.subcategory_ids,
        }),
      );
      return ProductMapper.fromGrpcProduct(result.product);
    } catch (err) {
      this.logger.error(`[createProduct] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductById(
    productId: number,
    productOptions?: ProductOptions,
  ): Promise<Product> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProduct({
          product_id: productId,
          options: TypesMapper.toGrpcProductOptions(productOptions),
        }),
      );
      return ProductMapper.fromGrpcProduct(result.product);
    } catch (err) {
      this.logger.error(`[getProductById] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductsByFarm(
    farmId: string,
    getProductByFarmDto?: GetProductByFarmDto,
  ): Promise<PaginationResult<Product>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProductsByFarm({
          farm_id: farmId,
          options: TypesMapper.toGrpcProductOptions({
            include_categories: getProductByFarmDto.include_categories,
          }),
          pagination: PaginationMapper.toGrpcPaginationRequest({
            limit: getProductByFarmDto.limit,
            order: getProductByFarmDto.order,
            page: getProductByFarmDto.page,
            sort_by: getProductByFarmDto.sort_by,
            skip: getProductByFarmDto.skip,
          }),
        }),
      );
      return {
        data: result.products.map((value) =>
          ProductMapper.fromGrpcProduct(value),
        ),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(`[getProductsByFarm] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async deleteProduct(productId: number, userId: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.deleteProduct({
          product_id: productId,
          user_id: userId,
        }),
      );
      return result.success;
    } catch (err) {
      this.logger.error(`[deleteProduct] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductsByCategory(
    categoryId: number,
    getProductByFarmDto?: GetProductByFarmDto,
  ): Promise<PaginationResult<Product>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProductsByCategory({
          category_id: categoryId,
          options: TypesMapper.toGrpcProductOptions({
            include_categories: getProductByFarmDto.include_categories,
          }),
          pagination: PaginationMapper.toGrpcPaginationRequest({
            limit: getProductByFarmDto.limit,
            order: getProductByFarmDto.order,
            page: getProductByFarmDto.page,
            sort_by: getProductByFarmDto.sort_by,
            skip: getProductByFarmDto.skip,
          }),
        }),
      );
      return {
        data: result.products.map((value) =>
          ProductMapper.fromGrpcProduct(value),
        ),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(`[getProductsByCategory] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getProductsBySubCategory(
    subcategoryId: number,
    getProductByFarmDto?: GetProductByFarmDto,
  ): Promise<PaginationResult<Product>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getProductsBySubCategory({
          subcategory_id: subcategoryId,
          options: TypesMapper.toGrpcProductOptions({
            include_categories: getProductByFarmDto.include_categories,
          }),
          pagination: PaginationMapper.toGrpcPaginationRequest({
            limit: getProductByFarmDto.limit,
            order: getProductByFarmDto.order,
            page: getProductByFarmDto.page,
            sort_by: getProductByFarmDto.sort_by,
            skip: getProductByFarmDto.skip,
          }),
        }),
      );
      return {
        data: result.products.map((value) =>
          ProductMapper.fromGrpcProduct(value),
        ),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(`[getProductsByCategory] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async updateProduct(
    userId: string,
    productId: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.updateProduct({
          product_id: productId,
          user_id: userId,
          product_name: updateProductDto.product_name,
          description: updateProductDto.description,
          price_per_unit: updateProductDto.price_per_unit,
          unit: updateProductDto.unit,
          stock_quantity: updateProductDto.stock_quantity,
          weight: updateProductDto.weight,
          image_urls: updateProductDto.image_urls
            ? { list: updateProductDto.image_urls }
            : undefined,
          video_urls: updateProductDto.video_urls
            ? { list: updateProductDto.video_urls }
            : undefined,
        }),
      );
      return ProductMapper.fromGrpcProduct(result.product);
    } catch (err) {
      this.logger.error(`[updateProduct] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async searchProducts(
    searchDto: SearchProductsDto,
  ): Promise<PaginationResult<Product>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.searchProducts({
          query: searchDto.search,
          pagination: {
            limit: searchDto.limit,
            page: searchDto.page,
            order: EnumMapper.toGrpcSortOrder(searchDto.order),
            sort_by: searchDto.sort_by,
            all: searchDto.all,
          },
          min_price: searchDto.min_price,
          max_price: searchDto.max_price,
          min_rating: searchDto.min_rating,
          max_rating: searchDto.max_rating,
          min_total_sold: searchDto.min_total_sold,
          status: EnumMapper.toGrpcProductStatus(searchDto.status),
          subcategories_id: searchDto.subcategory_id,
          is_category: searchDto.is_category,
          options: {
            include_farm: searchDto.include_farm,
            include_categories: searchDto.include_categories,
            include_farm_address: searchDto.include_farm_address,
            include_farm_stats: searchDto.include_farm_stats,
          },
        }),
      );
      return {
        data: result.products.map((value) =>
          ProductMapper.fromGrpcProduct(value),
        ),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(`[searchProducts] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async updateProductStatus(
    userId: string,
    productId: number,
    status: ProductStatus,
  ): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.updateProductStatus({
          product_id: productId,
          user_id: userId,
          status: EnumMapper.toGrpcProductStatus(status),
        }),
      );
      return result.success;
    } catch (err) {
      this.logger.error(`[updateProductStatus] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async openProductForSale(userId: string, productId: number): Promise<string> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.openProductForSale({
          product_id: productId,
          user_id: userId,
        }),
      );
      return result.qr_code;
    } catch (err) {
      this.logger.error(`[openProductForSale] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  // async generateQRCode(
  //   productId: number,
  //   userId: string,
  // ): Promise<{ qr_code: string }> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.generateQrCode({
  //         product_id: productId,
  //         user_id: userId,
  //       }),
  //     );
  //     return { qr_code: result.qr_code };
  //   } catch (err) {
  //     this.logger.error(`[generateQRCode] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }

  async activateBlockchain(
    productId: number,
    userId: string,
    activateDto: ActivateBlockchainDto
  ): Promise<{ blockchain_hash: string; success: boolean }> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.activateBlockchain({
          product_id: productId,
          user_id: userId,
          latitude: activateDto.latitude,
          longitude: activateDto.longitude
        }),
      );
      return {
        blockchain_hash: result.blockchain_hash,
        success: result.success,
      };
    } catch (err) {
      this.logger.error(`[activateBlockchain] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getQRCode(productId: number) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getQrCode({
          product_id: productId,
        }),
      );
      return { qr_code: result.qr_code };
    } catch (err) {
      this.logger.error(`[getQRCode] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async verifyTraceability(productId: number) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.verifyTraceability({
          product_id: productId,
        }),
      );
      return {
        isValid: result.is_valid,
        error: result.error,
        verificationDate: TypesMapper.fromGrpcTimestamp(result.verification_date)
      };
    } catch (err) {
      this.logger.error(`[verifyTraceability] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }
}
