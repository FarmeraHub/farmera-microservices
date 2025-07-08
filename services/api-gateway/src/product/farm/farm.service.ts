import {
  ProductsServiceClient,
  VerifyFarmRequest,
} from '@farmera/grpc-proto/dist/products/products';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { FarmMapper } from 'src/mappers/product/farm.mapper';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';
import { randomUUID } from 'crypto';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { Farm, FarmAnalytics } from './entities/farm.entity';
import { SearchFarmDto } from './dto/search-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { plainToInstance } from 'class-transformer';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { UserService } from 'src/user/user/user.service';
import { UserRole } from 'src/common/enums/user/roles.enum';

@Injectable()
export class FarmService implements OnModuleInit {
  private readonly logger = new Logger(FarmService.name);
  private productGrpcService: ProductsServiceClient;

  constructor(
    @Inject('PRODUCTS_PACKAGE') private client: ClientGrpc,
    private readonly userService: UserService,
  ) {}

  onModuleInit() {
    this.productGrpcService =
      this.client.getService<ProductsServiceClient>('ProductsService');
  }

  async farmRegister(farmRegistrationDto: FarmRegistrationDto, userId: string) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createFarm(
          FarmMapper.toGrpcCreateFarmRequest(farmRegistrationDto, userId),
        ),
      );

      // Update user role to FARMER and set farm_id after successful farm registration
      try {
        await this.userService.updateUserRole(
          userId,
          UserRole.FARMER,
          result.farm.farm_id,
        );
        this.logger.log(
          `Updated user ${userId} role to FARMER and set farm_id to ${result.farm.farm_id} after farm registration`,
        );
      } catch (roleUpdateError) {
        this.logger.error(
          `Failed to update user role and farm_id for user ${userId}: ${roleUpdateError.message}`,
        );
        // Don't throw here as farm registration was successful
      }

      return FarmMapper.fromGrpcFarm(result.farm);
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async farmVerify(
    ssn_image: Express.Multer.File,
    biometric_video: Express.Multer.File,
    farmId: string,
    userId: string,
  ) {
    const CHUNK_SIZE = 64 * 1024; // 64 KB

    const files = [
      { file: ssn_image, file_type: 'ssn_image' },
      { file: biometric_video, file_type: 'biometric_video' },
    ];

    const request$ = new Observable<VerifyFarmRequest>((subscriber) => {
      for (const { file, file_type } of files) {
        const id = randomUUID();
        // send metadata
        subscriber.next({
          meta: {
            farm_id: farmId,
            file_id: id,
            file_name: file.originalname,
            mime_type: file.mimetype,
            total_size: file.buffer.length,
            file_type: file_type,
            user_id: userId,
          },
        });

        // send chunks
        let offset = 0;
        while (offset < file.buffer.length) {
          const end = Math.min(offset + CHUNK_SIZE, file.buffer.length);
          const chunk = file.buffer.subarray(offset, end);

          subscriber.next({
            chunk: {
              file_id: id,
              data: chunk,
            },
          });

          offset = end;
        }
      }
      subscriber.complete();
    });

    try {
      const result = await firstValueFrom(
        this.productGrpcService.verifyFarm(request$),
      );
      return FarmMapper.fromGrpcFarm(result.farm);
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getFarm(farmId: string) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getFarm({
          farm_id: farmId,
        }),
      );

      const farm = FarmMapper.fromGrpcFarm(result.farm);

      // Add analytics data
      farm.analytics = await this.getFarmAnalytics(farmId);

      return farm;
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async getFarmByUserId(userId: string) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getFarmByUser({
          user_id: userId,
        }),
      );

      const farm = FarmMapper.fromGrpcFarm(result.farm);

      // Add analytics data
      farm.analytics = await this.getFarmAnalytics(farm.farm_id);

      return farm;
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async listFarms(
    pagination?: PaginationOptions,
  ): Promise<PaginationResult<Farm>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.listFarms({
          pagination: PaginationMapper.toGrpcPaginationRequest(pagination),
        }),
      );
      return {
        data: result.farms.map((value) => FarmMapper.fromGrpcFarm(value)),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async searchFarms(searchDto: SearchFarmDto): Promise<PaginationResult<Farm>> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.searchFarm({
          search_query: searchDto.query,
          pagination: PaginationMapper.toGrpcPaginationRequest({
            page: searchDto.page,
            limit: searchDto.limit,
            sort_by: searchDto.sort_by,
            order: searchDto.order,
            all: searchDto.all,
            skip: searchDto.skip,
          }),
          approved_only: searchDto.approve_only,
          location_filter: {
            latitude: searchDto.latitude,
            longitude: searchDto.longitude,
            radius_km: searchDto.radius_km,
          },
        }),
      );
      return {
        data: result.farms.map((value) => FarmMapper.fromGrpcFarm(value)),
        pagination: PaginationMapper.fromGrpcPaginationResponse(
          result.pagination,
        ),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  private async getFarmAnalytics(farmId: string): Promise<FarmAnalytics> {
    try {
      // Get farm products for analytics
      const farmProductsResult = await firstValueFrom(
        this.productGrpcService.getProductsByFarm({
          farm_id: farmId,
          pagination: { page: 1, limit: 1000, all: true },
        }),
      );

      const products = farmProductsResult.products || [];
      const totalProducts = products.length;
      const totalSales = products.reduce(
        (sum, product) => sum + (product.total_sold || 0),
        0,
      );
      const totalRevenue = products.reduce(
        (sum, product) =>
          sum + (product.total_sold || 0) * (product.price_per_unit || 0),
        0,
      );
      const averageRating =
        products.length > 0
          ? products.reduce(
              (sum, product) => sum + (product.average_rating || 0),
              0,
            ) / products.length
          : 0;

      // Top selling products
      const topSellingProducts = products
        .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
        .slice(0, 5)
        .map((product) => ({
          product_name: product.product_name,
          sales: product.total_sold || 0,
        }));

      // Generate mock monthly revenue for last 6 months
      const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - index);
        const monthName = date.toLocaleDateString('vi-VN', {
          month: 'long',
          year: 'numeric',
        });
        return {
          month: monthName,
          revenue: Math.floor(totalRevenue * (0.1 + Math.random() * 0.2)),
        };
      }).reverse();

      this.logger.log(
        `Farm analytics for ${farmId}: total_products=${totalProducts}, products=${products.length}`,
      );

      return {
        total_products: totalProducts,
        total_sales: totalSales,
        total_revenue: totalRevenue,
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: Math.floor(totalSales * 0.3), // Estimate 30% of sales have reviews
        followers_count: Math.floor(totalSales * 0.2), // Estimate followers based on sales
        active_processes: Math.floor(totalProducts * 0.8), // Estimate 80% have active processes
        recent_orders: Math.floor(totalSales * 0.1), // Estimate 10% are recent orders
        top_selling_products: topSellingProducts,
        monthly_revenue: monthlyRevenue,
      };
    } catch (err) {
      this.logger.warn(
        `Failed to get farm analytics for ${farmId}: ${err.message}`,
      );
      // Return default analytics if failed
      return {
        total_products: 0,
        total_sales: 0,
        total_revenue: 0,
        average_rating: 0,
        total_reviews: 0,
        followers_count: 0,
        active_processes: 0,
        recent_orders: 0,
        top_selling_products: [],
        monthly_revenue: [],
      };
    }
  }

  async updateFarm(
    farmId: string,
    updateFarmDto: UpdateFarmDto,
    userId: string,
  ): Promise<Farm> {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.updateFarm({
          farm_id: farmId,
          farm_name: updateFarmDto.farm_name,
          description: updateFarmDto.description,
          user_id: userId,
        }),
      );

      return FarmMapper.fromGrpcFarm(result.farm);
    } catch (err) {
      this.logger.error(`[updateFarm] ${err.message}`);
      throw ErrorMapper.fromGrpcError(err);
    }
  }
}
