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

  // async openProductForSale(userId: string, productId: number): Promise<string> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.openProductForSale({
  //         product_id: productId,
  //         user_id: userId,
  //       }),
  //     );
  //     return result.qr_code;
  //   } catch (err) {
  //     this.logger.error(`[openProductForSale] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }

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

  // async activateBlockchain(
  //   productId: number,
  //   userId: string,
  // ): Promise<{ blockchain_hash: string; success: boolean }> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.activateBlockchain({
  //         product_id: productId,
  //         user_id: userId,
  //       }),
  //     );
  //     return {
  //       blockchain_hash: result.blockchain_hash,
  //       success: result.success,
  //     };
  //   } catch (err) {
  //     this.logger.error(`[activateBlockchain] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }

  // async getQRCode(productId: number): Promise<{ qr_code: string | null }> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.getQrCode({
  //         product_id: productId,
  //       }),
  //     );
  //     return { qr_code: (result as any).qr_code || null };
  //   } catch (err) {
  //     this.logger.error(`[getQRCode] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }

  // async getTraceabilityData(productId: number): Promise<any> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.getTraceabilityData({
  //         product_id: productId,
  //       }),
  //     );

  //     // Helper function to convert gRPC timestamp to ISO string
  //     const convertTimestamp = (timestamp: any): string => {
  //       if (!timestamp?.value?.seconds) return new Date().toISOString();
  //       const seconds = parseInt(timestamp.value.seconds);
  //       const nanos = timestamp.value.nanos || 0;
  //       return new Date(seconds * 1000 + nanos / 1000000).toISOString();
  //     };

  //     // Map gRPC response to REST format like other endpoints
  //     const traceabilityData = result.traceability_data;

  //     return {
  //       product: traceabilityData?.product
  //         ? ProductMapper.fromGrpcProduct(traceabilityData.product)
  //         : null,
  //       assignments:
  //         traceabilityData?.assignments?.map((assignment) => ({
  //           assignment_id: assignment.assignment_id,
  //           product_id: assignment.product_id,
  //           process_id: assignment.process_id,
  //           assigned_date: convertTimestamp(assignment.assigned_date),
  //           status: assignment.status,
  //           completion_percentage: assignment.completion_percentage,
  //           created: convertTimestamp(assignment.created),
  //           updated: convertTimestamp(assignment.updated),
  //           current_step_order: assignment.current_step_order,
  //           start_date: assignment.start_date
  //             ? convertTimestamp(assignment.start_date)
  //             : null,
  //           actual_completion_date: assignment.actual_completion_date
  //             ? convertTimestamp(assignment.actual_completion_date)
  //             : null,
  //           process_template: assignment.process_template
  //             ? {
  //               process_id: assignment.process_template.process_id,
  //               process_name: assignment.process_template.process_name,
  //               description: assignment.process_template.description,
  //               farm_id: assignment.process_template.farm_id,
  //               is_active: assignment.process_template.is_active,
  //               created: convertTimestamp(
  //                 assignment.process_template.created,
  //               ),
  //               updated: convertTimestamp(
  //                 assignment.process_template.updated,
  //               ),
  //               estimated_duration_days:
  //                 assignment.process_template.estimated_duration_days,
  //               steps:
  //                 assignment.process_template.steps?.map((step) => ({
  //                   step_id: step.step_id,
  //                   process_id: step.process_id,
  //                   step_order: step.step_order,
  //                   step_name: step.step_name,
  //                   step_description: step.step_description,
  //                   is_required: step.is_required,
  //                   created: convertTimestamp(step.created),
  //                   estimated_duration_days: step.estimated_duration_days,
  //                   instructions: step.instructions,
  //                 })) || [],
  //             }
  //             : null,
  //         })) || [],
  //       step_diaries:
  //         traceabilityData?.step_diaries?.map((diary) => ({
  //           entry_id: diary.diary_id, // Map diary_id to entry_id
  //           assignment_id: diary.assignment_id,
  //           step_id: diary.step_id,
  //           step_name: diary.step_name,
  //           step_order: diary.step_order,
  //           notes: diary.notes,
  //           image_urls: diary.image_urls || [], // Map image_urls directly
  //           video_urls: diary.video_urls || [], // Map video_urls directly
  //           recorded_date: convertTimestamp(diary.recorded_date),
  //           is_completed: diary.completion_status === 1, // Fix: Use enum value instead of string
  //           created_by: null, // Not available in gRPC response
  //           updated_at: convertTimestamp(diary.updated),
  //           // Additional fields for potential future use
  //           latitude: diary.latitude,
  //           longitude: diary.longitude,
  //           weather_conditions: diary.weather_conditions,
  //           quality_rating: diary.quality_rating,
  //           issues_encountered: diary.issues_encountered,
  //           additional_data: diary.additional_data,
  //           created: convertTimestamp(diary.created),
  //         })) || [],
  //     };
  //   } catch (err) {
  //     this.logger.error(`[getTraceabilityData] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }

  // async verifyTraceability(productId: number): Promise<{
  //   isValid: boolean;
  //   error?: string;
  //   verificationDate: string;
  // }> {
  //   try {
  //     const result = await firstValueFrom(
  //       this.productGrpcService.verifyTraceability({
  //         product_id: productId,
  //       }),
  //     );
  //     return {
  //       isValid: result.is_valid,
  //       error: result.error,
  //       verificationDate: result.verification_date,
  //     };
  //   } catch (err) {
  //     this.logger.error(`[verifyTraceability] ${err.message}`);
  //     throw ErrorMapper.fromGrpcError(err);
  //   }
  // }
}
