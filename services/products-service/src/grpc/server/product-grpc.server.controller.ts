import { FarmAdminService } from './../../admin/farm/farm-admin.service';
import {
  BadRequestException,
  ConflictException,
  Controller,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoriesService } from 'src/categories/categories.service';
import { FarmsService } from 'src/farms/farms.service';
import { ProductsService } from 'src/products/products.service';
import {
  ProductsServiceControllerMethods,
  ProductsServiceController,
  GetListProductsRequest,
  GetListProductsResponse,
  GetProductRequest,
  GetProductResponse,
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
  CreateFarmRequest,
  CreateFarmResponse,
  VerifyFarmRequest,
  VerifyFarmResponse,
  VerifyFileMetadata,
  GetFarmByUserResponse,
  GetCategoryTreeResponse,
  GetCategoryTreeRequest,
  CreateReviewRequest,
  CreateReviewResponse,
  UpdateReviewRequest,
  UpdateReviewResponse,
  ApproveReviewRequest,
  ApproveReviewResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  DeleteReplyRequest,
  DeleteReplyResponse,
  DeleteReviewRequest,
  DeleteReviewResponse,
  UpdateReplyRequest,
  UpdateReplyResponse,
  CreateProcessRequest,
  CreateProcessResponse,
  GetProcessRequest,
  GetProcessResponse,
  ListProcessesRequest,
  ListProcessesResponse,
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  ListFarmsRequest,
  ListFarmsResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  UpdateFarmRequest,
  UpdateFarmResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  GetAllCategoryWithSubcategoryRequest,
  GetAllCategoryWithSubcategoryResponse,
  SearchCategoryRequest,
  SearchCategoryResponse,
  SearchFarmRequest,
  SearchFarmResponse,
  GetProductsByCategoryRequest,
  GetProductsByCategoryResponse,
  GetProductsByFarmRequest,
  GetProductsByFarmResponse,
  GetProductsBySubCategoryRequest,
  GetProductsBySubCategoryResponse,
  UpdateProductStatusRequest,
  UpdateProductStatusResponse,
  OpenProductForSaleRequest,
  OpenProductForSaleResponse,
  ListReviewsRequest,
  ListReviewsResponse,
  CreateDiaryRequest,
  CreateDiaryResponse,
  GetDiaryRequest,
  GetDiaryResponse,
  GetDiariesByProcessRequest,
  GetDiariesByProcessResponse,
  UpdateDiaryRequest,
  UpdateDiaryResponse,
  DeleteDiaryRequest,
  DeleteDiaryResponse,
  CreateProcessTemplateRequest,
  CreateProcessTemplateResponse,
  GetProcessTemplatesByFarmRequest,
  GetProcessTemplatesByFarmResponse,
  GetProcessTemplateByIdRequest,
  GetProcessTemplateByIdResponse,
  UpdateProcessTemplateRequest,
  UpdateProcessTemplateResponse,
  DeleteProcessTemplateRequest,
  DeleteProcessTemplateResponse,
  GetProcessStepsRequest,
  GetProcessStepsResponse,
  ReorderProcessStepsRequest,
  ReorderProcessStepsResponse,
  AssignProductToProcessRequest,
  AssignProductToProcessResponse,
  GetProductProcessAssignmentRequest,
  GetProductProcessAssignmentResponse,
  UnassignProductFromProcessRequest,
  UnassignProductFromProcessResponse,
  CreateStepDiaryRequest,
  CreateStepDiaryResponse,
  GetStepDiariesRequest,
  GetStepDiariesResponse,
  GetProductDiariesRequest,
  GetProductDiariesResponse, GetReviewOverviewRequest,
  GetReviewOverviewResponse,

} from '@farmera/grpc-proto/dist/products/products';
import { Observable, Subject } from 'rxjs';
import { UpdateFarmStatusDto } from 'src/admin/farm/dto/update-farm-status.dto';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { GrpcStreamMethod, RpcException } from '@nestjs/microservices';
import { FarmMapper } from '../../mappers/product/farm.mapper';
import { VerifyStatusCode } from '@farmera/grpc-proto/dist/common/enums';
import { Readable } from 'stream';
import { CategoryMapper } from '../../mappers/product/category.mapper';
import { ReviewsService } from 'src/reviews/reviews.service';
import { ReviewMapper } from '../../mappers/product/review.mapper';
import { ProcessService } from 'src/process/process.service';
import { TypesMapper } from '../../mappers/common/types.mapper';
import { ProcessMapper } from '../../mappers/product/process.mapper';
import { EnumsMapper } from '../../mappers/common/enums.mapper';
import { status } from '@grpc/grpc-js';
import { CreateSubcategoryDto } from 'src/categories/dto/create-subcategories.dto';
import { ErrorMapper } from '../../mappers/common/error.mapper';
import { PaginationMapper } from '../../mappers/common/pagination.mapper';
import { ProductMapper } from "../../mappers/product/product.mapper";
import { ProcessTemplateService } from 'src/process/process-template.service';
import { StepDiaryService } from 'src/diary/step-diary.service';
import { DiaryService } from 'src/diary/diary.service';
import { ProcessTemplateMapper } from 'src/mappers/product/process-template.mapper';
import { DiaryMapper } from 'src/mappers/product/diary.mapper';

@Controller()
@ProductsServiceControllerMethods()
export class ProductGrpcServerController implements ProductsServiceController {
  private readonly logger = new Logger(ProductGrpcServerController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly farmsService: FarmsService,
    private readonly categoriesService: CategoriesService,
    private readonly farmAdminService: FarmAdminService,
    private readonly reviewService: ReviewsService,
    private readonly processService: ProcessService,
    private readonly processTemplateService: ProcessTemplateService,
    private readonly stepDiaryService: StepDiaryService,
    private readonly diaryService: DiaryService,
  ) { }

  // Product methods
  async createProduct(
    request: CreateProductRequest,
  ): Promise<CreateProductResponse> {
    try {
      const result = await this.productsService.create(
        {
          product_name: request.product_name,
          description: request.description,
          price_per_unit: request.price_per_unit,
          unit: request.unit,
          stock_quantity: request.stock_quantity,
          weight: request.weight,
          subcategory_ids: request.subcategory_ids,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
        },
        request.user_id,
      );
      return {
        product: ProductMapper.toGrpcProduct(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProduct(request: GetProductRequest): Promise<GetProductResponse> {
    try {
      const result = await this.productsService.findProductById(
        request.product_id,
        TypesMapper.fromGrpcProductOptions(request.options),
      );
      return {
        product: ProductMapper.toGrpcProduct(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateProduct(
    request: UpdateProductRequest,
  ): Promise<UpdateProductResponse> {
    try {
      const result = await this.productsService.updateProduct(
        request.product_id,
        {
          product_name: request.product_name,
          description: request.description,
          price_per_unit: request.price_per_unit,
          unit: request.unit,
          stock_quantity: request.stock_quantity,
          weight: request.weight,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
        },
        request.user_id,
      );
      return {
        product: ProductMapper.toGrpcProduct(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async deleteProduct(
    request: DeleteProductRequest,
  ): Promise<DeleteProductResponse> {
    try {
      const result = await this.productsService.deleteProduct(
        request.product_id,
        request.user_id,
      );
      return {
        success: result,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async searchProducts(
    request: SearchProductsRequest,
  ): Promise<SearchProductsResponse> {
    try {
      const result = await this.productsService.searchAndFilterProducts(
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
        {
          search: request.query,
          minPrice: request.min_price,
          maxPrice: request.max_price,
          minRating: request.min_rating,
          maxRating: request.max_rating,
          minTotalSold: request.min_total_sold,
          status: EnumsMapper.fromGrpcProductStatus(request.status),
          subCategoryId: request.subcategories_id,
          isCategory: request.is_category,
        },
        TypesMapper.fromGrpcProductOptions(request.options),
      );
      return {
        products: result.data.map((value) =>
          ProductMapper.toGrpcProduct(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(result.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProductsByFarm(
    request: GetProductsByFarmRequest,
  ): Promise<GetProductsByFarmResponse> {
    try {
      const result = await this.productsService.findProductsByFarmId(
        request.farm_id,
        TypesMapper.fromGrpcProductOptions(request.options),
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
      );
      return {
        products: result.data.map((value) =>
          ProductMapper.toGrpcProduct(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(result.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProductsByCategory(
    request: GetProductsByCategoryRequest,
  ): Promise<GetProductsByCategoryResponse> {
    try {
      const result = await this.productsService.findProductsByCategory(
        request.category_id,
        true,
        TypesMapper.fromGrpcProductOptions(request.options),
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
      );
      return {
        products: result.data.map((value) =>
          ProductMapper.toGrpcProduct(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(result.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProductsBySubCategory(
    request: GetProductsBySubCategoryRequest,
  ): Promise<GetProductsBySubCategoryResponse> {
    try {
      const result = await this.productsService.findProductsByCategory(
        request.subcategory_id,
        false,
        TypesMapper.fromGrpcProductOptions(request.options),
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
      );
      return {
        products: result.data.map((value) =>
          ProductMapper.toGrpcProduct(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(result.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateProductStatus(
    request: UpdateProductStatusRequest,
  ): Promise<UpdateProductStatusResponse> {
    try {
      const status = EnumsMapper.fromGrpcProductStatus(request.status);
      if (!status) {
        throw new BadRequestException('Trạng thái không hợp lệ');
      }
      const result = await this.productsService.updateProductStatus(
        request.user_id,
        request.product_id,
        status,
      );

      return {
        success: result,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getListProducts(
    request: GetListProductsRequest,
  ): Promise<GetListProductsResponse> {
    try {
      const result = await this.productsService.findProductsByIds(
        request.product_ids,
        TypesMapper.fromGrpcProductOptions(request.options),
      );
      return {
        products: result.map((value) => ProductMapper.toGrpcProduct(value)),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async openProductForSale(
    request: OpenProductForSaleRequest,
  ): Promise<OpenProductForSaleResponse> {
    try {
      const result = await this.productsService.openProductForSale(
        request.user_id,
        request.product_id,
      );
      return {
        qr_code: result,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async generateQrCode(request: any): Promise<any> {
    try {
      const result = await this.productsService.generateQRCode(
        request.product_id,
        request.user_id,
      );
      return { qr_code: result };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async activateBlockchain(request: any): Promise<any> {
    try {
      const result = await this.productsService.activateBlockchain(
        request.product_id,
        request.user_id,
      );
      return {
        blockchain_hash: result.blockchain_hash,
        success: result.success,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getQrCode(request: any): Promise<any> {
    try {
      const result = await this.productsService.getQRCode(request.product_id);
      return { qr_code: result };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Farm methods
  async createFarm(request: CreateFarmRequest): Promise<CreateFarmResponse> {
    try {
      const result = await this.farmsService.farmRegister(
        FarmMapper.fromGrpcCreateFarmRequest(request),
        request.user_id,
      );
      return {
        farm: FarmMapper.toGrpcFarm(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  @GrpcStreamMethod()
  verifyFarm(
    request: Observable<VerifyFarmRequest>,
  ): Observable<VerifyFarmResponse> {
    const subject = new Subject<VerifyFarmResponse>();

    const fileRecords: Record<
      string,
      {
        chunks_buffer: Buffer[];
        receivedSize: number;
        totalSize: number;
        meta: VerifyFileMetadata;
        type: string;
      }
    > = {};

    const onNext = (data: VerifyFarmRequest) => {
      try {
        // get metadata
        if (data.meta) {
          const file_id = data.meta.file_id;

          if (!file_id) {
            subject.next({
              status: VerifyStatusCode.FAILED,
              farm: undefined,
              message: 'ID không xác định',
            });
            subject.complete();
          }

          this.logger.debug('Received metadata:', data.meta);

          if (data.meta.total_size == 0) {
            subject.next({
              status: VerifyStatusCode.FAILED,
              farm: undefined,
              message: 'File rỗng',
            });
            subject.complete();
          }

          fileRecords[file_id] = {
            chunks_buffer: [],
            receivedSize: 0,
            totalSize: data.meta.total_size,
            meta: data.meta,
            type: data.meta.file_type,
          };
        }
        // continue to get image chunks
        else if (data.chunk) {
          const { file_id, data: chunkData } = data.chunk;
          const fileRecord = fileRecords[file_id];

          if (!fileRecord) {
            this.logger.warn(`Received chunk for unknown file_id: ${file_id}`);
            return;
          }

          fileRecord.receivedSize += chunkData.length;

          fileRecords[data.chunk.file_id].chunks_buffer.push(
            Buffer.from(data.chunk.data),
          );
        } else {
          this.logger.warn('Unexpected request: ', data);
        }
      } catch (err) {
        this.logger.error('Error processing chunk:', err);
        subject.error(
          new RpcException({
            message: 'Error processing chunk: ' + err.message,
            code: status.CANCELLED,
          }),
        );
      }
    };

    const onError = (err) => {
      subject.error(
        new RpcException({
          message: 'Failed to verify: ' + err.message,
          code: status.INTERNAL,
        }),
      );
    };

    const onComplete = async () => {
      try {
        const ssnRecord = Object.values(fileRecords).find(
          (record) => record.type == 'ssn_image',
        );
        const bioRecord = Object.values(fileRecords).find(
          (record) => record.type == 'biometric_video',
        );

        if (!ssnRecord || !bioRecord) {
          return subject.error(
            new RpcException({
              message: 'Thiếu ảnh CCCD hoặc video sinh trắc học',
              code: status.INVALID_ARGUMENT,
            }),
          );
        }

        const ssnBuffer = Buffer.concat(ssnRecord.chunks_buffer);

        const ssnFile: Express.Multer.File = {
          fieldname: 'ssn',
          originalname: ssnRecord.meta.file_name,
          encoding: '7bit',
          mimetype: ssnRecord.meta.mime_type,
          buffer: ssnBuffer,
          size: ssnBuffer.length,
          stream: Readable.from(ssnBuffer),
          destination: '',
          path: '',
          filename: ssnRecord.meta.file_name,
        };

        const bioVideoBuffer = Buffer.concat(bioRecord.chunks_buffer);

        const videoFile: Express.Multer.File = {
          fieldname: 'biometric_video',
          originalname: bioRecord.meta.file_name,
          encoding: '7bit',
          mimetype: bioRecord.meta.mime_type,
          buffer: bioVideoBuffer,
          size: bioVideoBuffer.length,
          stream: Readable.from(bioVideoBuffer),
          destination: '',
          filename: bioRecord.meta.file_name,
          path: '',
        };

        const farm = await this.farmsService.verifyBiometric(
          ssnFile,
          videoFile,
          ssnRecord.meta.farm_id,
          ssnRecord.meta.user_id,
        );

        subject.next({
          farm: FarmMapper.toGrpcFarm(farm),
          status: VerifyStatusCode.OK,
        });
        subject.complete();
      } catch (err) {
        throw ErrorMapper.toRpcException(err);
      }
    };

    request.subscribe({
      next: onNext,
      error: onError,
      complete: onComplete,
    });

    return subject.asObservable();
  }

  async getFarm(request: GetFarmRequest): Promise<GetFarmResponse> {
    try {
      const farmEntity = await this.farmsService.findFarmById(request.farm_id);
      return {
        farm: FarmMapper.toGrpcFarm(farmEntity),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getFarmByUser(
    request: GetFarmByUserRequest,
  ): Promise<GetFarmByUserResponse> {
    try {
      const farmEntity = await this.farmsService.findByUserID(request.user_id);
      return {
        farm: FarmMapper.toGrpcFarm(farmEntity),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.toRpcException(err);
    }
  }

  updateFarm(
    request: UpdateFarmRequest,
  ):
    | Promise<UpdateFarmResponse>
    | Observable<UpdateFarmResponse>
    | UpdateFarmResponse {
    throw new Error('Method not implemented.');
  }

  async listFarms(request: ListFarmsRequest): Promise<ListFarmsResponse> {
    try {
      const farms = await this.farmsService.listFarms(
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
      );
      return {
        farms: farms.data.map((value) => FarmMapper.toGrpcFarm(value)),
        pagination: PaginationMapper.toGrpcPaginationResponse(farms.meta),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.toRpcException(err);
    }
  }

  async searchFarm(request: SearchFarmRequest): Promise<SearchFarmResponse> {
    try {
      const geoLocation = TypesMapper.fromGrpcGeoLocation(
        request.location_filter,
      );
      const pagination = PaginationMapper.fromGrpcPaginationRequest(
        request.pagination,
      );
      const farms = await this.farmsService.searchFarm(
        {
          query: request.search_query,
          approve_only: request.approved_only,
          latitude: geoLocation?.latitude,
          longitude: geoLocation?.longitude,
          radius_km: geoLocation?.radius_km,
        },
        pagination,
      );
      return {
        farms: farms.data.map((value) => FarmMapper.toGrpcFarm(value)),
        pagination: PaginationMapper.toGrpcPaginationResponse(farms.meta),
      };
    } catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Admin methods
  async updateFarmStatus(
    request: UpdateFarmStatusRequest,
  ): Promise<UpdateFarmStatusResponse> {
    this.logger.debug(
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
      this.logger.debug(
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
      this.logger.debug(
        `[gRPC Logic - UpdateFarmStatus] Successfully updated farm status for farm_id: ${updatedFarm.farm_id}`,
      );
      const farm = FarmMapper.toGrpcFarm(updatedFarm);
      if (!farm) {
        this.logger.warn(
          '[gRPC Logic - UpdateFarmStatus] Failed to map updated farm entity to gRPC response.',
        );
        throw new RpcException(
          'Failed to map updated farm entity to gRPC response.',
        );
      }
      return {
        farm: farm,
      };
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

  // Category methods
  async getAllCategoryWithSubcategory(
    request: GetAllCategoryWithSubcategoryRequest,
  ): Promise<GetAllCategoryWithSubcategoryResponse> {
    try {
      const categories =
        await this.categoriesService.getCategoriesWithSubcategories(
          PaginationMapper.fromGrpcPaginationRequest(request.pagination),
        );
      this.logger.debug(
        `[gRPC Logic - GetAllCategoryWithSubcategory] Successfully fetched ${categories.data.length} categories with subcategories.`,
      );
      return {
        category: categories.data.map((value) =>
          CategoryMapper.toGrpcCategoryWithSubs(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(categories.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async searchCategory(
    request: SearchCategoryRequest,
  ): Promise<SearchCategoryResponse> {
    try {
      const categories = await this.categoriesService.searchCategory(
        request.name,
        PaginationMapper.fromGrpcPaginationRequest(request.pagination),
      );
      this.logger.debug(
        `[gRPC Logic - GetAllCategoryWithSubcategory] Successfully fetched ${categories.data.length} categories with subcategories.`,
      );
      return {
        category: categories.data.map((value) =>
          CategoryMapper.toGrpcCategoryWithSubs(value),
        ),
        pagination: PaginationMapper.toGrpcPaginationResponse(categories.meta),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async createCategory(
    request: CreateCategoryRequest,
  ): Promise<CreateCategoryResponse> {
    try {
      const categoryData = await this.categoriesService.createCategory({
        name: request.name,
        description: request.description,
        image_url: request.category_icon_url,
      });
      return {
        category: CategoryMapper.toGrpcCategory(categoryData),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
    try {
      const category = await this.categoriesService.getCategoryById(
        request.category_id,
      );
      return {
        category: CategoryMapper.toGrpcCategory(category),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async createSubcategory(
    request: CreateSubcategoryRequest,
  ): Promise<CreateSubcategoryResponse> {
    try {
      const req: CreateSubcategoryDto = {
        name: request.name,
        description: request.description || '',
        category_id: request.category_id,
      };
      // create subcategory
      const subcategory = await this.categoriesService.createSubcategory(req);
      return {
        subcategory: CategoryMapper.toGrpcSubCategory(subcategory),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getSubcategory(
    request: GetSubcategoryRequest,
  ): Promise<GetSubcategoryResponse> {
    try {
      const subcategory = await this.categoriesService.getSubcategoryById(
        request.subcategory_id,
      );
      return {
        subcategory: CategoryMapper.toGrpcSubCategory(subcategory),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getCategoryTree(
    request: GetCategoryTreeRequest,
  ): Promise<GetCategoryTreeResponse> {
    try {
      const result = await this.categoriesService.getSubCategoryTree(
        request.category_id,
      );
      return {
        category: CategoryMapper.toGrpcCategory(result),
        sublist: result.subcategories.map((value) =>
          CategoryMapper.toGrpcSubcategoryLite(value),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Review methods
  async createReview(
    request: CreateReviewRequest,
  ): Promise<CreateReviewResponse> {
    try {
      const result = await this.reviewService.createReview(
        {
          product_id: request.product_id,
          rating: request.rating,
          comment: request.comment,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
        },
        request.user_id,
      );
      return {
        review: ReviewMapper.toGrpcReview(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async createReply(request: CreateReplyRequest): Promise<CreateReplyResponse> {
    try {
      const result = await this.reviewService.createReply(
        {
          review_id: request.review_id,
          reply: request.reply,
        },
        request.user_id,
      );
      return {
        reply: ReviewMapper.toGrpcReply(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateReview(
    request: UpdateReviewRequest,
  ): Promise<UpdateReviewResponse> {
    try {
      const result = await this.reviewService.updateReview(
        request.review_id,
        {
          rating: request.rating,
          comment: request.comment,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
        },
        request.user_id,
      );
      return {
        review: ReviewMapper.toGrpcReview(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateReply(request: UpdateReplyRequest): Promise<UpdateReplyResponse> {
    const result = await this.reviewService.updateReply(
      request.reply_id,
      request.reply,
      request.user_id,
    );
    return {
      reply: ReviewMapper.toGrpcReply(result),
    };
  }

  async deleteReview(
    request: DeleteReviewRequest,
  ): Promise<DeleteReviewResponse> {
    const result = await this.reviewService.deleteReview(
      request.review_id,
      request.user_id,
    );
    return {
      success: result,
    };
  }

  async deleteReply(request: DeleteReplyRequest): Promise<DeleteReplyResponse> {
    const result = await this.reviewService.deleteReply(
      request.reply_id,
      request.user_id,
    );
    return {
      success: result,
    };
  }

  async approveReview(
    request: ApproveReviewRequest,
  ): Promise<ApproveReviewResponse> {
    const result = await this.reviewService.approveReview(
      request.review_id,
      request.approved,
    );
    return {
      success: result,
    };
  }

  async listReviews(request: ListReviewsRequest): Promise<ListReviewsResponse> {
    try {
      const result = await this.reviewService.getReviewsByCursor(
        request.product_id,
        request.pagination?.sort_by ?? 'created',
        request.pagination?.order ? EnumsMapper.fromGrpcPaginationOrder(request.pagination.order) : 'DESC',
        request.pagination?.limit ?? 10,
        request.pagination?.cursor ?? '',
        request.rating_filter
      );
      return {
        reviews: result.data.reviews.map((value) => ReviewMapper.toGrpcReview(value)),
        pagination: {
          next_cursor: result.data.nextCursor ?? undefined
        }
      }
    }
    catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getReviewOverview(request: GetReviewOverviewRequest): Promise<GetReviewOverviewResponse> {
    try {
      const result = await this.reviewService.getReviewOverview(request.product_id);
      return {
        total_count: result.totalCount,
        total_ratings: result.totalRating,
        average_rating: result.averageRating,
        rating_overview: result.ratings
      }
    }
    catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // verified
  // Process methods
  async createProcess(
    request: CreateProcessRequest,
  ): Promise<CreateProcessResponse> {
    try {
      const result = await this.processService.createProcess(
        {
          product_id: request.product_id,
          stage_name: EnumsMapper.fromGrpcProcessStage(request.stage_name),
          description: request.description,
          start_date: TypesMapper.fromGrpcTimestamp(request.start_date),
          end_date: TypesMapper.fromGrpcTimestamp(request.end_date),
          latitude: request.latitude,
          longitude: request.longitude,
          image_urls: request.image_urls,
          video_urls: request.video_urls?.list,
        },
        request.user_id,
      );
      return {
        process: ProcessMapper.toGrpcProcess(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProcess(request: GetProcessRequest): Promise<GetProcessResponse> {
    try {
      const result = await this.processService.getProcess(request.process_id);
      return { process: ProcessMapper.toGrpcProcess(result) };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async listProcesses(
    request: ListProcessesRequest,
  ): Promise<ListProcessesResponse> {
    try {
      const result = await this.processService.getProcesses(
        request.product_id,
        10,
        undefined,
        undefined,
      );
      return {
        processes: result.data.processes.map((value) =>
          ProcessMapper.toGrpcProcess(value),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Diary methods
  async createDiary(request: CreateDiaryRequest): Promise<CreateDiaryResponse> {
    try {
      const result = await this.diaryService.create(
        {
          process_id: request.process_id,
          step_name: request.step_name,
          step_description: request.step_description,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
          recorded_date: TypesMapper.fromGrpcTimestamp(
            request.recorded_date,
          )?.toISOString(),
          latitude: request.latitude,
          longitude: request.longitude,
          notes: request.notes,
        },
        request.user_id,
      );
      return {
        diary: DiaryMapper.toGrpcDiary(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getDiary(request: GetDiaryRequest): Promise<GetDiaryResponse> {
    try {
      const result = await this.diaryService.findOne(request.diary_id);
      return {
        diary: DiaryMapper.toGrpcDiary(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getDiariesByProcess(
    request: GetDiariesByProcessRequest,
  ): Promise<GetDiariesByProcessResponse> {
    try {
      const result = await this.diaryService.findByProcessId(
        request.process_id,
      );
      return {
        diaries: result.map((value) => DiaryMapper.toGrpcDiary(value)),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateDiary(request: UpdateDiaryRequest): Promise<UpdateDiaryResponse> {
    try {
      const result = await this.diaryService.update(
        {
          diary_id: request.diary_id,
          step_name: request.step_name,
          step_description: request.step_description,
          image_urls: request.image_urls?.list,
          video_urls: request.video_urls?.list,
          recorded_date: request.recorded_date
            ? TypesMapper.fromGrpcTimestamp(
              request.recorded_date,
            )?.toISOString()
            : undefined,
          latitude: request.latitude,
          longitude: request.longitude,
          notes: request.notes,
        },
        request.user_id,
      );
      return {
        diary: DiaryMapper.toGrpcDiary(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async deleteDiary(request: DeleteDiaryRequest): Promise<DeleteDiaryResponse> {
    try {
      const result = await this.diaryService.remove(
        request.diary_id,
        request.user_id,
      );
      return {
        success: result,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Process Template methods
  async createProcessTemplate(
    request: CreateProcessTemplateRequest,
  ): Promise<CreateProcessTemplateResponse> {
    try {
      const createDto = {
        process_name: request.process_name,
        description: request.description,
        estimated_duration_days: request.estimated_duration_days,
        is_active: request.is_active,
        steps: request.steps.map((step: any) =>
          ProcessTemplateMapper.fromGrpcCreateProcessStepInput(step),
        ),
      };

      const result = await this.processTemplateService.createProcessTemplate(
        createDto,
        request.user_id,
      );

      return {
        template: ProcessTemplateMapper.toGrpcProcessTemplate(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProcessTemplatesByFarm(
    request: GetProcessTemplatesByFarmRequest,
  ): Promise<GetProcessTemplatesByFarmResponse> {
    try {
      const result =
        await this.processTemplateService.getProcessTemplatesByFarm(
          request.user_id,
        );

      return {
        templates: result.map((template) =>
          ProcessTemplateMapper.toGrpcProcessTemplate(template),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProcessTemplateById(
    request: GetProcessTemplateByIdRequest,
  ): Promise<GetProcessTemplateByIdResponse> {
    try {
      const result = await this.processTemplateService.getProcessTemplateById(
        request.process_id,
        request.user_id,
      );

      return {
        template: ProcessTemplateMapper.toGrpcProcessTemplate(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async updateProcessTemplate(
    request: UpdateProcessTemplateRequest,
  ): Promise<UpdateProcessTemplateResponse> {
    try {
      const updateDto = {
        process_name: request.process_name,
        description: request.description,
        estimated_duration_days: request.estimated_duration_days,
        is_active: request.is_active,
        steps: request.steps?.map((step: any) =>
          ProcessTemplateMapper.fromGrpcUpdateProcessStepInput(step),
        ),
      };

      const result = await this.processTemplateService.updateProcessTemplate(
        request.process_id,
        updateDto,
        request.user_id,
      );

      return {
        template: ProcessTemplateMapper.toGrpcProcessTemplate(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async deleteProcessTemplate(
    request: DeleteProcessTemplateRequest,
  ): Promise<DeleteProcessTemplateResponse> {
    try {
      await this.processTemplateService.deleteProcessTemplate(
        request.process_id,
        request.user_id,
      );

      return { success: true };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProcessSteps(
    request: GetProcessStepsRequest,
  ): Promise<GetProcessStepsResponse> {
    try {
      const result = await this.processTemplateService.getProcessSteps(
        request.process_id,
        request.user_id,
      );

      return {
        steps: result.map((step) =>
          ProcessTemplateMapper.toGrpcProcessStep(step),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async reorderProcessSteps(
    request: ReorderProcessStepsRequest,
  ): Promise<ReorderProcessStepsResponse> {
    try {
      await this.processTemplateService.reorderProcessSteps(
        request.process_id,
        request.step_orders,
        request.user_id,
      );

      return { success: true };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Product Process Assignment methods
  async assignProductToProcess(
    request: AssignProductToProcessRequest,
  ): Promise<AssignProductToProcessResponse> {
    try {
      const assignDto = {
        process_id: request.process_id,
        start_date: request.start_date
          ? TypesMapper.fromGrpcTimestamp(request.start_date)
          : undefined,
        target_completion_date: request.target_completion_date
          ? TypesMapper.fromGrpcTimestamp(request.target_completion_date)
          : undefined,
      };

      const result = await this.processTemplateService.assignProductToProcess(
        request.product_id,
        assignDto,
        request.user_id,
      );

      return {
        assignment:
          ProcessTemplateMapper.toGrpcProductProcessAssignment(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProductProcessAssignment(
    request: GetProductProcessAssignmentRequest,
  ): Promise<GetProductProcessAssignmentResponse> {
    try {
      const result =
        await this.processTemplateService.getProductProcessAssignment(
          request.product_id,
          request.user_id,
        );

      return {
        assignment: result
          ? ProcessTemplateMapper.toGrpcProductProcessAssignment(result)
          : undefined,
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async unassignProductFromProcess(
    request: UnassignProductFromProcessRequest,
  ): Promise<UnassignProductFromProcessResponse> {
    try {
      await this.processTemplateService.unassignProductFromProcess(
        request.product_id,
        request.user_id,
      );

      return { success: true };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  // Step Diary methods
  async createStepDiary(
    request: CreateStepDiaryRequest,
  ): Promise<CreateStepDiaryResponse> {
    try {
      const createDto = {
        assignment_id: request.assignment_id,
        step_id: request.step_id,
        product_id: request.product_id,
        step_name: request.step_name,
        step_order: request.step_order,
        notes: request.notes,
        completion_status: request.completion_status
          ? ProcessTemplateMapper.fromGrpcDiaryCompletionStatus(
            request.completion_status,
          )
          : undefined,
        image_urls: request.image_urls,
        video_urls: request.video_urls,
        recorded_date: request.recorded_date
          ? TypesMapper.fromGrpcTimestamp(request.recorded_date)
          : undefined,
        latitude: request.latitude,
        longitude: request.longitude,
        weather_conditions: request.weather_conditions,
        quality_rating: request.quality_rating,
        issues_encountered: request.issues_encountered,
        additional_data: request.additional_data
          ? JSON.parse(request.additional_data)
          : undefined,
      };

      const result = await this.stepDiaryService.createStepDiary(
        createDto,
        request.user_id,
      );

      return {
        diary: ProcessTemplateMapper.toGrpcStepDiaryEntry(result),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getStepDiaries(
    request: GetStepDiariesRequest,
  ): Promise<GetStepDiariesResponse> {
    try {
      const result = await this.stepDiaryService.getStepDiaries(
        request.product_id,
        request.step_id,
        request.user_id,
      );

      return {
        diaries: result.map((diary) =>
          ProcessTemplateMapper.toGrpcStepDiaryEntry(diary),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }

  async getProductDiaries(
    request: GetProductDiariesRequest,
  ): Promise<GetProductDiariesResponse> {
    try {
      const result = await this.stepDiaryService.getProductDiaries(
        request.product_id,
        request.user_id,
      );

      return {
        diaries: result.map((diary) =>
          ProcessTemplateMapper.toGrpcStepDiaryEntry(diary),
        ),
      };
    } catch (err) {
      throw ErrorMapper.toRpcException(err);
    }
  }
}
