import { FarmAdminService } from './../../admin/farm/farm-admin.service';
import { Product as ProductEntity } from './../../products/entities/product.entity';
import { Controller, Logger } from "@nestjs/common";
import { CategoriesService } from "src/categories/categories.service";
import { FarmsService } from "src/farms/farms.service";
import { ProductsService } from "src/products/products.service";
import {
    ProductsServiceControllerMethods,
    ProductsServiceController,
    GetListProductsRequest,
    GetListProductsResponse,
    GetProductRequest,
    GetProductResponse,
    GetAllCategoryWithSubcategoryResponse,
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
    CreateFarmRequest,
    CreateFarmResponse,
    VerifyFarmRequest,
    VerifyFarmResponse,
    VerifyFileMetadata,
    GetFarmByUserResponse,
    GetCategoryTreeResponse,
    GetCategoryTreeRequest,

} from '@farmera/grpc-proto/dist/products/products';
import { Observable, Subject } from 'rxjs';
import { ProductMapper } from './mappers/product.mapper';
import { CreateSubcategoryDto } from 'src/categories/dto/request/create-subcategories.dto';
import { UpdateFarmStatusDto } from 'src/admin/farm/dto/update-farm-status.dto';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { GrpcStreamMethod, RpcException } from '@nestjs/microservices';
import { FarmMapper } from './mappers/product/farm.mapper';
import { VerifyStatusCode } from '@farmera/grpc-proto/dist/common/enums';
import { Readable } from 'stream';
import { CategoryMapper } from './mappers/product/category.mapper';

@Controller()
@ProductsServiceControllerMethods()
export class ProductGrpcServerController implements ProductsServiceController {
    private readonly logger = new Logger(ProductGrpcServerController.name);

    constructor(
        private readonly productsService: ProductsService,
        private readonly farmsService: FarmsService,
        private readonly categoriesService: CategoriesService,
        private readonly farmAdminService: FarmAdminService,
    ) { }

    // Farm methods
    // verified
    async createFarm(request: CreateFarmRequest): Promise<CreateFarmResponse> {
        try {
            const result = await this.farmsService.farmRegister(FarmMapper.fromGrpcCreateFarmRequest(request), request.user_id);
            return {
                farm: FarmMapper.toGrpcFarm(result)
            }
        }
        catch (err) {
            throw new RpcException(`Internal Server Error: ${err}`);
        }
    }

    // verified
    @GrpcStreamMethod()
    verifyFarm(request: Observable<VerifyFarmRequest>): Observable<VerifyFarmResponse> {
        const subject = new Subject<VerifyFarmResponse>();

        const fileRecords: Record<string, {
            chunks_buffer: Buffer[];
            receivedSize: number;
            totalSize: number;
            meta: VerifyFileMetadata;
            type: string;
        }> = {};

        const onNext = (data: VerifyFarmRequest) => {
            try {
                // get metadata
                if (data.meta) {

                    const file_id = data.meta.file_id;

                    if (!file_id) {
                        subject.next({
                            status: VerifyStatusCode.FAILED,
                            farm: undefined,
                            message: "ID không xác định",
                        });
                        subject.complete();
                    }

                    this.logger.debug('Received metadata:', data.meta);

                    if (data.meta.total_size == 0) {
                        subject.next({
                            status: VerifyStatusCode.FAILED,
                            farm: undefined,
                            message: "File rỗng",
                        });
                        subject.complete();
                    };

                    fileRecords[file_id] = {
                        chunks_buffer: [],
                        receivedSize: 0,
                        totalSize: data.meta.total_size,
                        meta: data.meta,
                        type: data.meta.file_type,
                    }
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

                    fileRecords[data.chunk.file_id].chunks_buffer.push(Buffer.from(data.chunk.data));

                } else {
                    this.logger.warn('Unexpected request: ', data);
                }
            } catch (err) {
                this.logger.error('Error processing chunk:', err);
                subject.error({
                    message: 'Error processing chunk: ' + err.message,
                    code: VerifyStatusCode.FAILED,
                });
            }
        }

        const onError = (err) => {
            subject.error({
                message: 'Failed to verify: ' + err.message,
                code: VerifyStatusCode.FAILED,
            });
        }

        const onComplete = async () => {
            try {
                const ssnRecord = Object.values(fileRecords).find(record => record.type == "ssn_image");
                const bioRecord = Object.values(fileRecords).find(record => record.type == "biometric_video");

                if (!ssnRecord || !bioRecord) {
                    return subject.error({
                        message: 'Thiếu ảnh CCCD hoặc video sinh trắc học',
                        code: VerifyStatusCode.FAILED,
                    });
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
                    path: ''
                };

                const farm = await this.farmsService.verifyBiometric(ssnFile, videoFile, ssnRecord.meta.farm_id, ssnRecord.meta.user_id);

                subject.next({
                    farm: FarmMapper.toGrpcFarm(farm),
                    status: VerifyStatusCode.OK
                });
                subject.complete();

            } catch (err) {
                console.error('Verification error:', err);
                subject.error({
                    message: 'Xử lý verify thất bại: ' + err.message,
                    code: VerifyStatusCode.FAILED,
                });
            }
        }

        request.subscribe({
            next: onNext,
            error: onError,
            complete: onComplete,
        });

        return subject.asObservable();
    }

    // verified
    async getFarm(request: GetFarmRequest): Promise<GetFarmResponse> {
        // this.logger.log(`[gRPC In - GetFarm] Received request for farm_id: ${request.farm_id}`);

        if (!request || !request.farm_id) {
            this.logger.error('[gRPC In - GetFarm] Invalid request: farm_id is required.');
            throw new RpcException('Invalid request: farm_id is required.');
        }

        const farmEntity = await this.farmsService.findFarmById(request.farm_id);

        if (!farmEntity) {
            this.logger.warn(`[gRPC Logic - GetFarm] No farm found for ID: ${request.farm_id}`);
            throw new RpcException(`No farm found for ID: ${request.farm_id}`);
        }

        return {
            farm: FarmMapper.toGrpcFarm(farmEntity)
        };
    }

    // verified
    async getFarmByUser(request: GetFarmByUserRequest): Promise<GetFarmByUserResponse> {
        this.logger.log(`[gRPC In - GetFarm] Received request for user_id: ${request.user_id}`);

        if (!request || !request.user_id) {
            this.logger.error('[gRPC In - GetFarm] Invalid request: farm_id is required.');
            throw new RpcException('Invalid request: farm_id is required.');
        }

        const farmEntity = await this.farmsService.findByUserID(request.user_id);

        if (!farmEntity) {
            this.logger.warn(`[gRPC Logic - GetFarm] No farm found for user id: ${request.user_id}`);
            throw new RpcException(`No farm found for User ID: ${request.user_id}`);
        }

        return {
            farm: FarmMapper.toGrpcFarm(farmEntity)
        };
    }

    // Admin methods
    async updateFarmStatus(request: UpdateFarmStatusRequest): Promise<UpdateFarmStatusResponse> {
        this.logger.debug(`[gRPC In - UpdateFarmStatus] Received request to update farm status: ${JSON.stringify(request)}`);

        if (!request || !request.farm_id || !request.status) {
            this.logger.error('[gRPC In - UpdateFarmStatus] Invalid request: farm_id and status are required.');
            throw new RpcException('Invalid request: farm_id and status are required.');
        }

        try {
            this.logger.debug(`[gRPC Logic - UpdateFarmStatus] Updating farm status for farm_id: ${request.farm_id} to status: ${request.status}`);
            const updateDto: UpdateFarmStatusDto = {
                status: FarmStatus[request.status],
                reason: request.reason || '',
            };
            const updatedFarm = await this.farmAdminService.updateFarmStatus(request.farm_id, updateDto, request.user_id);
            this.logger.debug(`[gRPC Logic - UpdateFarmStatus] Successfully updated farm status for farm_id: ${updatedFarm.farm_id}`);
            const farm = FarmMapper.toGrpcFarm(updatedFarm);
            if (!farm) {
                this.logger.warn('[gRPC Logic - UpdateFarmStatus] Failed to map updated farm entity to gRPC response.');
                throw new RpcException('Failed to map updated farm entity to gRPC response.');
            }
            return {
                farm: farm
            };
        } catch (error) {
            this.logger.error(`[gRPC Logic - UpdateFarmStatus] Error updating farm status for farm_id ${request.farm_id}: ${error.message}`, error.stack);
            throw new RpcException(`Error processing UpdateFarmStatus request: ${error.message}`);
        }
    }

    // Product methods
    async getProduct(
        request: GetProductRequest,
    ): Promise<GetProductResponse> {
        if (!request || !request.product_id) {
            this.logger.error('[gRPC In - GetProduct] Invalid request: product_id is required.');
            throw new RpcException('Invalid request: product_id is required.');
        }
        this.logger.log(`[gRPC In - GetProduct] Received request for product_id: ${request.product_id}`);
        try {
            const productEntity = await this.productsService.findProductById(request.product_id, {
                includeFarm: true,
                includeSubcategoryDetails: true, // Bật nếu cần thông tin subcategory
                includeCategory: true, // Bật nếu cần thông tin category
                includeAddress: true, // Bật nếu cần thông tin address
                includeAddressGhn: true, // Bật nếu cần thông tin address GHN
            });
            if (!productEntity) {
                this.logger.warn(`[gRPC Logic - GetProduct] No product found for ID: ${request.product_id}`);
                throw new RpcException(`No product found for ID: ${request.product_id}`);
            }
            this.logger.log(`[gRPC Logic - GetProduct] Successfully fetched product: ${productEntity.product_id}`);
            const result = ProductMapper.toGrpcGetProductResponse(productEntity);
            this.logger.log(`[gRPC Out - GetProduct] Returning product: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`[gRPC In - GetProduct] Error fetching product with ID ${request.product_id}: ${error.message}`, error.stack);
            if (error instanceof RpcException) {
                throw error;
            }
            throw new RpcException(`Error processing GetProduct request: ${error.message}`);
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
            .map(pReq => pReq.product_id)
            .filter(id => id !== undefined && id !== null); // Lọc ID hợp lệ

        if (productIdsToFetch.length === 0) {
            return ProductMapper.toGrpcGetListProductsResponse([]);
        }

        try {
            this.logger.log(`[gRPC In - GetListProducts] Fetching products for IDs: ${JSON.stringify(productIdsToFetch)}`);
            const productEntitiesWithDetails: ProductEntity[] = await this.productsService.findProductsByIds(
                productIdsToFetch,
                {
                    includeFarm: true,
                    //includeSubcategoryDetails:false,
                    // includeCategory: false,
                    includeAddress: true,
                    includeAddressGhn: true,
                    includeIdentification: true, // Bật nếu cần thông tin identification
                }
            );

            if (!productEntitiesWithDetails || productEntitiesWithDetails.length === 0) {

                this.logger.log('[gRPC Logic - GetListProducts] No products found for the given IDs.');
                return ProductMapper.toGrpcGetListProductsResponse([]);
            }

            const grpcProductResponseItems = productEntitiesWithDetails.map(pEntity => {
                const farmEntity = pEntity.farm;
                const addressEntity = farmEntity?.address; // Sử dụng optional chaining
                const identificationEntity = farmEntity?.identification;
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, Farm: ${farmEntity?.farm_id}`);
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, address: ${JSON.stringify(addressEntity, null, 2)}`);
                this.logger.log(`[gRPC Logic - GetListProducts] Processing product: ${pEntity.product_id}, identification: ${JSON.stringify(identificationEntity, null, 2)}`);


                return ProductMapper.toGrpcProductResponse(
                    pEntity,
                    farmEntity,
                );
            });

            const finalResponse = ProductMapper.toGrpcGetListProductsResponse(grpcProductResponseItems);
            this.logger.log(`[gRPC Out - GetListProducts] Successfully processed. Returning ${finalResponse.products_found.length} products.`);
            return finalResponse;

        } catch (error) {
            this.logger.error(`[gRPC In - GetListProducts] Error fetching products for IDs ${JSON.stringify(productIdsToFetch)}: ${error.message}`, error.stack);
            if (error instanceof RpcException) {
                throw error;
            }
            throw new RpcException(`Error processing GetListProducts request: ${error.message}`);
        }
    }

    // Category methods
    async getAllCategoryWithSubcategory(request: GetAllCategoryWithSubcategoryRequest): Promise<GetAllCategoryWithSubcategoryResponse> {
        const categories = await this.categoriesService.getCategoriesWithSubcategories();
        if (!categories || categories.length === 0) {
            this.logger.warn('[gRPC Logic - GetAllCategoryWithSubcategory] No categories found.');
            return { categories: [], pagination: undefined };
        }
        this.logger.log(`[gRPC Logic - GetAllCategoryWithSubcategory] Successfully fetched ${categories.length} categories with subcategories.`);
        const result = ProductMapper.toGrpcGetAllCategoryWithSubcategoryResponse(categories);
        this.logger.log(`[gRPC Out - GetAllCategoryWithSubcategory] Returning ${result.categories.length} categories.`);
        return result;

    }

    // verified
    async createCategory(request: CreateCategoryRequest): Promise<CreateCategoryResponse> {
        this.logger.debug(`[gRPC In - CreateCategory] Received request to create category: ${JSON.stringify(request)}`);
        if (!request || !request.name) {
            this.logger.error('[gRPC In - CreateCategory] Invalid request: name is required.');
            throw new RpcException('Invalid request: name is required.');
        }
        const categoryData = await this.categoriesService.createCategory({
            name: request.name,
            description: request.description,
            icon_url: request.category_icon_url,
        });
        return {
            category: CategoryMapper.toGrpcCategory(categoryData),
        };
    }

    // verified
    async getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
        const category = await this.categoriesService.getCategoryById(request.category_id);
        if (!category) {
            this.logger.error(`[gRPC Logic - GetCategory] No category found for ID: ${request.category_id}`);
            throw new RpcException(`No category found for ID: ${request.category_id}`);
        }
        this.logger.log(`[gRPC Logic - GetCategory] Successfully fetched category: ${category.category_id}`);
        const result = CategoryMapper.toGrpcCategory(category);
        if (!result) {
            this.logger.warn('[gRPC Logic - GetCategory] No category found after fetching.');
            throw new RpcException('No category found after fetching.');
        }
        this.logger.debug(`[gRPC Out - GetCategory] Returning category: ${JSON.stringify(result)}`);
        return {
            category: result
        };
    }

    // verified
    async createSubcategory(request: CreateSubcategoryRequest): Promise<CreateSubcategoryResponse> {
        this.logger.debug(`[gRPC In - CreateSubcategory] Received request to create subcategory: ${JSON.stringify(request)}`);
        if (!request || !request.name || !request.category_id) {
            this.logger.error('[gRPC In - CreateSubcategory] Invalid request: name and category_id are required.');
            throw new RpcException('Invalid request: name and category_id are required.');
        }
        const req: CreateSubcategoryDto = {
            name: request.name,
            description: request.description || '',
            category_id: request.category_id,
        }
        // create subcategory
        const subcategory = await this.categoriesService.createSubcategory(req);

        if (!subcategory) {
            this.logger.error('[gRPC Logic - CreateSubcategory] Failed to create subcategory.');
            throw new RpcException('Failed to create subcategory.');
        }
        this.logger.debug(`[gRPC Logic - CreateSubcategory] Successfully created subcategory: ${subcategory.subcategory_id}`);

        // convert to grpc message
        const result = CategoryMapper.toGrpcSubCategory(subcategory);

        if (!result) {
            this.logger.error('[gRPC Logic - CreateSubcategory] No subcategory found after creation.');
            throw new RpcException('No subcategory found after creation.');
        }
        return {
            subcategory: result
        };
    }

    // verified
    async getSubcategory(request: GetSubcategoryRequest): Promise<GetSubcategoryResponse> {
        this.logger.log(`[gRPC In - GetSubcategory] Received request for subcategory_id: ${request.subcategory_id}`);
        if (!request || !request.subcategory_id) {
            this.logger.error('[gRPC In - GetSubcategory] Invalid request: subcategory_id is required.');
            throw new RpcException('Invalid request: subcategory_id is required.');
        }
        const subcategory = await this.categoriesService.getSubcategoryById(request.subcategory_id);
        if (!subcategory) {
            this.logger.error(`[gRPC Logic - GetSubcategory] No subcategory found for ID: ${request.subcategory_id}`);
            throw new RpcException(`No subcategory found for ID: ${request.subcategory_id}`);
        }
        const result = CategoryMapper.toGrpcSubCategory(subcategory);
        this.logger.debug(`[gRPC Out - GetSubcategory] Returning subcategory: ${JSON.stringify(result)}`);
        if (!result) {
            this.logger.warn('[gRPC Logic - GetSubcategory] No subcategory found after fetching.');
            throw new RpcException('No subcategory found after fetching.');
        }
        return {
            subcategory: result
        };
    }

    // verified
    async getCategoryTree(request: GetCategoryTreeRequest): Promise<GetCategoryTreeResponse> {
        const result = await this.categoriesService.getSubCategoryTree(request.category_id);
        if (!result) {
            throw new RpcException("");
        }
        return {
            category: CategoryMapper.toGrpcCategory(result),
            sublist: result.subcategories.map((value) => CategoryMapper.toGrpcSubcategoryLite(value))
        }
    }
}
