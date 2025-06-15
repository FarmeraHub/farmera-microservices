import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Farm } from './../farms/entities/farm.entity';
import { CategoriesService } from './../categories/categories.service';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { DataSource, In, Repository } from "typeorm";
import { CreateProductDto } from "./dto/request/create-product.dto";
import { ProductSubcategoryDetail } from './entities/product-subcategory-detail.entity';
import { FarmsService } from 'src/farms/farms.service';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { ResponseProductDto } from './dto/response/response-product.dto';
import { ResponseFarmDto } from 'src/farms/dto/response-farm.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { SavedFileResult } from 'src/file-storage/storage.strategy.interface';
import { UpdateProductDto } from './dto/request/update-product.dto';
@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    constructor(

        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @InjectRepository(ProductSubcategoryDetail)
        private readonly productSubcategoryDetailRepository: Repository<ProductSubcategoryDetail>,
        private dataSource: DataSource,
        private readonly categoriesService: CategoriesService,
        private readonly farmsService: FarmsService,
        private readonly fileStorageService: FileStorageService,
    ) { }
    async create(
        createProductDto: CreateProductDto,
        userId: string,
        files: { product_images?: Express.Multer.File[], product_videos?: Express.Multer.File[] }
    ): Promise<Product> {
        const farm = await this.farmsService.findByUserID(userId);
        if (!farm) { throw new BadRequestException('Farm không tồn tại'); }
        if ('status' in farm && farm.status !== FarmStatus.APPROVED) {
            throw new BadRequestException('Farm chưa được duyệt');
        }

        let savedImageResults: SavedFileResult[] = [];
        let savedVideoResults: SavedFileResult[] = [];

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (files.product_images && files.product_images.length > 0) {
                savedImageResults = await this.fileStorageService.saveFiles(files.product_images, 'product_images');
            }

            if (files.product_videos && files.product_videos.length > 0) {
                savedVideoResults = await this.fileStorageService.saveFiles(files.product_videos, 'product_videos');
            }

            const manager = queryRunner.manager;

            const imageUrls = savedImageResults.map(result => result.url);
            const videoUrls = savedVideoResults.map(result => result.url);

            const productDataToCreate = { ...createProductDto };
            delete productDataToCreate.subcategory_ids;

            const newProductEntity = manager.create(Product, {
                ...productDataToCreate,
                image_urls: imageUrls,
                video_urls: videoUrls,
                farm: farm,
                status: ProductStatus.PRE_ORDER,
            });

            const savedProduct = await manager.save(Product, newProductEntity);

            this.logger.log(`(create) Sản phẩm đã được lưu với ID: ${savedProduct}`);
            if (createProductDto.subcategory_ids && createProductDto.subcategory_ids.length > 0) {
                const notFoundSubID: number[] = [];
                for (const subId of createProductDto.subcategory_ids) {
                    const subcategory = await this.categoriesService.checkSubcategoryById(subId);
                    if (!subcategory) {
                        notFoundSubID.push(subId);
                    }
                }
                if (notFoundSubID.length > 0) {
                    throw new NotFoundException(`Không tìm thấy các danh mục phụ với ${notFoundSubID.join(', ')}`)

                } else {
                    for (const subId of createProductDto.subcategory_ids) {
                        const detail = manager.create(ProductSubcategoryDetail, {
                            product: { product_id: savedProduct.product_id },
                            subcategory: { subcategory_id: subId },
                        });
                        await manager.save(ProductSubcategoryDetail, detail);
                    }

                }
            }

            await queryRunner.commitTransaction();
            this.logger.log(`(create) Transaction đã commit thành công cho sản phẩm ID: ${savedProduct.product_id}`);


            return savedProduct;

        } catch (error) { // Bắt lỗi trong quá trình lưu file hoặc thao tác DB
            await queryRunner.rollbackTransaction();

            const resultsToCleanup = [...savedImageResults, ...savedVideoResults];
            if (resultsToCleanup.length > 0) {
                await this.fileStorageService.cleanupFiles(resultsToCleanup);
            }
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể tạo sản phẩm: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    async deleteProduct(productId: number, userId: string): Promise<{ message: string }> {
        const farm = await this.farmsService.findByUserID(userId);
        if (!farm) { throw new NotFoundException('Farm không tồn tại'); }

        const product = await this.productsRepository.findOne({
            where: { product_id: productId },
            relations: ['farm'],
        });
        if (!product) { throw new NotFoundException('Sản phẩm không tồn tại'); }

        if (!product.farm || product.farm.farm_id !== farm.farm_id) {
            throw new UnauthorizedException('Bạn không có quyền xoá sản phẩm này');
        }

        const urlsToDelete = [...(product.image_urls || []), ...(product.video_urls || [])];

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.delete(ProductSubcategoryDetail, { product: { product_id: productId } });

            const deleteResult = await queryRunner.manager.delete(Product, { product_id: productId });

            if (deleteResult.affected === 0) {
                throw new NotFoundException(`Không tìm thấy sản phẩm ID ${productId} để xóa trong transaction.`);
            }

            await queryRunner.commitTransaction();

            if (urlsToDelete.length > 0) {
                await this.fileStorageService.deleteFilesByUrl(urlsToDelete);
            }

            return { message: 'Xoá sản phẩm thành công' };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể xoá sản phẩm: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    async updateProduct(productId: number,
        updateProductDto: UpdateProductDto,
        userId: string,
        files: {
            product_images?: Express.Multer.File[], product_videos?: Express.Multer.File[]
        }): Promise<Product | null> {
        const userFarm = await this.farmsService.findByUserID(userId);
        if (!userFarm) { throw new NotFoundException('Farm của người dùng không tồn tại'); }

        const product = await this.productsRepository.findOne({
            where: { product_id: productId },
            relations: [
                'farm',
                'productSubcategoryDetails',
                'productSubcategoryDetails.subcategory',
            ],
        });

        if (!product) { throw new NotFoundException(`Sản phẩm ID ${productId} không tồn tại`); }

        if (!product.farm || product.farm.farm_id !== userFarm.farm_id) {
            throw new UnauthorizedException('Bạn không có quyền chỉnh sửa sản phẩm này');
        }


        let savedImageResults: SavedFileResult[] = [];
        let savedVideoResults: SavedFileResult[] = [];
        const oldImageUrls = product.image_urls || [];
        const oldVideoUrls = product.video_urls || [];
        const urlsToDeletePhysically: string[] = [];


        const currentSubcategoryIds = product.productSubcategoryDetails?.map(
            detail => detail.subcategory?.subcategory_id
        ).filter((id): id is number => id !== undefined && id !== null) || [];

        this.logger.log(`(updateProduct) Product found: ${JSON.stringify(product, null, 2)}`);
        this.logger.log(`(updateProduct) currentSubcategoryIds ${currentSubcategoryIds}`);


        // --- BƯỚC 3: BẮT ĐẦU TRANSACTION ---
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        this.logger.log('(updateProduct) Đã bắt đầu Transaction.');

        try {
            const manager = queryRunner.manager;

            // --- 4. Xử lý File Mới (Lưu file nếu có) ---
            // ... (Giữ nguyên logic lưu file mới) ...
            if (files?.product_images && files.product_images.length > 0) {
                savedImageResults = await this.fileStorageService.saveFiles(files.product_images, 'product_images');
            }
            if (files?.product_videos && files.product_videos.length > 0) {
                savedVideoResults = await this.fileStorageService.saveFiles(files.product_videos, 'product_videos');
            }

            // --- 5. Xử lý File Cũ (Xác định URL cần xóa vật lý) ---
            // ... (Giữ nguyên logic xác định urlsToDeletePhysically) ...
            const newImageUrlsFromFile = savedImageResults.map(r => r.url);
            const newVideoUrlsFromFile = savedVideoResults.map(r => r.url);
            const finalImageUrlsToKeep = updateProductDto.image_urls !== undefined ? updateProductDto.image_urls : oldImageUrls;
            oldImageUrls.forEach(oldUrl => { if (!finalImageUrlsToKeep.includes(oldUrl)) { urlsToDeletePhysically.push(oldUrl); } });
            const finalVideoUrlsToKeep = updateProductDto.video_urls !== undefined ? updateProductDto.video_urls : oldVideoUrls;
            oldVideoUrls.forEach(oldUrl => { if (!finalVideoUrlsToKeep.includes(oldUrl)) { urlsToDeletePhysically.push(oldUrl); } });


            // --- 6 & 9. Cập nhật Thông tin Cơ bản và URLs vào DB ---
            const fieldsToUpdate: Partial<Product> = {};
            // ... (Giữ nguyên logic gán các trường cơ bản từ DTO) ...
            if (updateProductDto.product_name !== undefined) fieldsToUpdate.product_name = updateProductDto.product_name;
            if (updateProductDto.description !== undefined) fieldsToUpdate.description = updateProductDto.description;
            if (updateProductDto.price_per_unit !== undefined) fieldsToUpdate.price_per_unit = updateProductDto.price_per_unit;
            if (updateProductDto.unit !== undefined) fieldsToUpdate.unit = updateProductDto.unit;
            if (updateProductDto.stock_quantity !== undefined) fieldsToUpdate.stock_quantity = updateProductDto.stock_quantity;
            if (updateProductDto.weight !== undefined) fieldsToUpdate.weight = updateProductDto.weight;
            //check logic nếu đăng bán ...
            if (updateProductDto.status !== undefined) fieldsToUpdate.status = updateProductDto.status;
            // Gộp và gán URLs cuối cùng
            fieldsToUpdate.image_urls = [...new Set([...finalImageUrlsToKeep, ...newImageUrlsFromFile])];
            fieldsToUpdate.video_urls = [...new Set([...finalVideoUrlsToKeep, ...newVideoUrlsFromFile])];

            // Cập nhật trực tiếp vào entity product đã lấy ra ban đầu
            Object.assign(product, fieldsToUpdate);


            // --- 7. Cập nhật Subcategories ---
            // ... (Giữ nguyên logic cập nhật subcategories dựa trên currentSubcategoryIds và DTO) ...
            if (updateProductDto.subcategory_ids !== undefined) {
                const requestedSubcategoryIds = updateProductDto.subcategory_ids || [];
                // ... (logic xóa detail cũ) ...
                const subcategoryIdsToDelete = currentSubcategoryIds.filter(id => !requestedSubcategoryIds.includes(id));
                if (subcategoryIdsToDelete.length > 0) {
                    await manager.delete(ProductSubcategoryDetail, { product: { product_id: productId }, subcategory: { subcategory_id: In(subcategoryIdsToDelete) } });
                }
                // ... (logic thêm detail mới) ...
                const subcategoryIdsToAdd = requestedSubcategoryIds.filter(id => !currentSubcategoryIds.includes(id));
                if (subcategoryIdsToAdd.length > 0) {
                    const subcategoryIdsToAdd = requestedSubcategoryIds.filter(id => !currentSubcategoryIds.includes(id));
                    if (subcategoryIdsToAdd.length > 0) {
                        const newDetailsToAdd: ProductSubcategoryDetail[] = [];
                        const notFoundSubcategoryIds: number[] = [];
                        for (const subId of subcategoryIdsToAdd) {
                            // Gọi hàm tìm subcategory theo ID (đảm bảo hàm này tồn tại trong CategoriesService)
                            const subcategoryExists = await this.categoriesService.checkSubcategoryById(subId);

                            if (subcategoryExists) {
                                // Nếu subcategory tồn tại, tạo bản ghi ProductSubcategoryDetail để chuẩn bị lưu
                                const newDetail = manager.create(ProductSubcategoryDetail, {
                                    product: { product_id: productId },
                                    subcategory: { subcategory_id: subId }, // Liên kết với subcategory ID hợp lệ
                                });
                                newDetailsToAdd.push(newDetail);
                            } else {
                                // Nếu subcategory không tồn tại, ghi nhận ID không tìm thấy
                                notFoundSubcategoryIds.push(subId);
                                this.logger.warn(`(updateProduct) Subcategory ID ${subId} không tồn tại.`);
                            }
                        }
                        if (notFoundSubcategoryIds.length > 0) {
                            // Nếu có bất kỳ ID nào không tìm thấy, ném lỗi NotFoundException
                            throw new NotFoundException(`Các subcategory với ID [${notFoundSubcategoryIds.join(', ')}] không tồn tại.`);
                        }

                        // Nếu tất cả các subcategory cần thêm đều hợp lệ, lưu các bản ghi newDetails đã tạo
                        if (newDetailsToAdd.length > 0) {
                            this.logger.log(`(updateProduct) Saving ${newDetailsToAdd.length} new subcategory details...`);
                            await manager.save(ProductSubcategoryDetail, newDetailsToAdd); // Lưu mảng các detail mới
                        } else {
                            // Trường hợp này không nên xảy ra nếu subcategoryIdsToAdd.length > 0 ban đầu
                            this.logger.warn(`(updateProduct) No valid new subcategory details to add, although IDs were requested.`);
                        }
                    }
                }
            }


            // --- 8. Lưu Thay đổi Product vào DB ---
            // Lưu lại entity product đã được cập nhật các trường và có thể cả relations (nếu TypeORM hỗ trợ cascade update)
            const updatedProduct = await manager.save(Product, product);


            // --- 10. Commit Transaction ---
            await queryRunner.commitTransaction();
            this.logger.log(`(updateProduct) Transaction committed successfully for product ID: ${productId}.`);


            // --- 11. Xóa File Vật lý (SAU KHI Commit) ---
            // ... (Giữ nguyên logic gọi deleteFilesByUrl) ...
            if (urlsToDeletePhysically.length > 0) {
                await this.fileStorageService.deleteFilesByUrl(urlsToDeletePhysically);
            }


            // Trả về sản phẩm đã cập nhật
            // Vì đã load hết relations ở đầu, updatedProduct có thể đã đủ thông tin
            // Nhưng để chắc chắn nhất, fetch lại lần cuối
            return this.productsRepository.findOne({
                where: { product_id: productId },
                relations: [ // Load lại các relations bạn muốn trả về
                    'farm',
                    'productSubcategoryDetails',
                    'productSubcategoryDetails.subcategory',
                    'productSubcategoryDetails.subcategory.category'
                ]
            });

        } catch (error) {
            // --- 12. Xử lý Rollback ---
            // ... (Giữ nguyên logic rollback và cleanupFiles) ...
            this.logger.error(`(updateProduct) Error during transaction: ${error.message}`, error.stack);
            await queryRunner.rollbackTransaction();
            this.logger.warn(`(updateProduct) Transaction rolled back.`);
            const resultsToCleanup = [...savedImageResults, ...savedVideoResults];
            if (resultsToCleanup.length > 0) {
                await this.fileStorageService.cleanupFiles(resultsToCleanup);
            }
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) { throw error; }
            throw new InternalServerErrorException(`Không thể cập nhật sản phẩm: ${error.message}`);
        } finally {
            await queryRunner.release();
            this.logger.log('(updateProduct) Query Runner released.');
        }
    }
    // async getProductById(id: string): Promise<ResponseProductDto> {
    //     const productId = Number(id);
    //     if (isNaN(productId)) {
    //         throw new BadRequestException('ID sản phẩm không hợp lệ');
    //     }

    //     const product = await this.productsRepository.findOne(
    //         {
    //             where: { product_id: productId },
    //             relations: ['farm', 'farm.address', 'productSubcategoryDetails', 'productSubcategoryDetails.subcategory', 'productSubcategoryDetails.subcategory.category'],
    //         },
    //     );
    //     if (!product) {
    //         throw new NotFoundException('Sản phẩm không tồn tại');
    //     }

    //     const farm = await this.farmsService.findFarmById(product.farm.farm_id);
    //     if (!farm) {
    //         throw new BadRequestException('Farm không tồn tại');
    //     }

    //     const responseFarm: ResponseFarmDto = {
    //         farm_id: product.farm.farm_id,
    //         farm_name: product.farm.farm_name,
    //         city: product.farm.address.city,
    //         description: product.farm.description,
    //         profile_image: product.farm.profile_image_urls,
    //         avatar: product.farm.avatar_url,
    //         certificate: product.farm.certificate_img_urls,
    //         created: product.farm.created,
    //         status: product.farm.status,
    //     };


    //     const subcategoryDetails = await this.productSubcategoryDetailRepository.find({
    //         where: { product: { product_id: productId } },
    //         relations: ['subcategory', 'subcategory.category'],
    //     });
    //     const categoryMap = new Map<string, string[]>();

    //     for (const detail of subcategoryDetails) {
    //         const categoryName = detail.subcategory.category.name;
    //         const subcategoryName = detail.subcategory.name;

    //         if (!categoryMap.has(categoryName)) {
    //             categoryMap.set(categoryName, []);
    //         }
    //         categoryMap.get(categoryName)!.push(subcategoryName);
    //     }

    //     const categories = Array.from(categoryMap.entries()).map(
    //         ([category, subcategories]) => ({
    //             category,
    //             subcategories,
    //         }),
    //     );

    //     const responseProduct = new ResponseProductDto({
    //         ...product,
    //         farm: responseFarm,
    //         categories,
    //     });


    //     return responseProduct;
    // }

    async searchAndFillterProducts(
        page: number,
        limit: number,
        search?: string,
        category?: string,
        subcategory?: string,
        minPrice?: number,
        maxPrice?: number,
        farmId?: string,
        status?: ProductStatus,
        sortBy?: string,
        sortOrder?: 'asc' | 'desc',
    ): Promise<{ items: ResponseProductDto[], totalItems: number, totalPages: number, currentPage: number }> {
        const queryBuilder = this.productsRepository.createQueryBuilder('product');
        queryBuilder
            .leftJoinAndSelect('product.farm', 'farm')
            .leftJoinAndSelect('farm.address', 'address')
            .leftJoinAndSelect('product.productSubcategoryDetails', 'productSubcategoryDetail')
            .leftJoinAndSelect('productSubcategoryDetail.subcategory', 'subcategory')
            .leftJoinAndSelect('subcategory.category', 'category');
        if (search) {
            queryBuilder.andWhere(
                '("product"."product_name" ILIKE :search OR "product"."description" ILIKE :search)',
                { search: `%${search}%` }
            );
        }
        if (category) {
            queryBuilder.andWhere('category.category_id = :categoryId', { categoryId: category });
        }
        if (subcategory) {
            queryBuilder.andWhere('subcategory.subcategory_id = :subcategoryId', { subcategoryId: subcategory });
        }
        console.log('minPrice:', minPrice);
        if (minPrice !== undefined) {
            queryBuilder.andWhere('product.price_per_unit >= :minPrice', { minPrice });
        }

        if (maxPrice !== undefined) {
            queryBuilder.andWhere('product.price_per_unit <= :maxPrice', { maxPrice });
        }
        // const sql = queryBuilder.getQuery();
        // console.log('SQL Query:', sql);

        if (farmId) {
            queryBuilder.andWhere('farm.farm_id = :farmId', { farmId });
        }
        if (status) {
            queryBuilder.andWhere('product.status = :status', { status });
        }

        if (sortBy) {
            const order = sortOrder?.toUpperCase() as 'ASC' | 'DESC' || 'ASC';

            switch (sortBy) {
                case 'price':
                    queryBuilder.orderBy('product.price_per_unit', order);
                    break;
                case 'name':
                    queryBuilder.orderBy('product.product_name', order);
                    break;
                case 'createdAt':
                    queryBuilder.orderBy('product.created', order);
                    break;
                default:
                    queryBuilder.orderBy('product.created', 'DESC'); // Default sort
            }
        } else {
            queryBuilder.orderBy('product.created', 'DESC');
        }

        const skip = (page - 1) * limit;

        const totalItems = await queryBuilder.getCount();
        const totalPages = Math.ceil(totalItems / limit);

        queryBuilder.skip(skip).take(limit);

        // Execute query
        const products = await queryBuilder.getMany();

        // Transform products to ResponseProductDto
        const items = await Promise.all(
            products.map(async (product) => {
                // Get subcategory details for the product
                const subcategoryDetails = await this.productSubcategoryDetailRepository.find({
                    where: { product: { product_id: product.product_id } },
                    relations: ['subcategory', 'subcategory.category'],
                });

                // Organize categories and subcategories
                const categoryMap = new Map<string, string[]>();
                for (const detail of subcategoryDetails) {
                    const categoryName = detail.subcategory.category.name;
                    const subcategoryName = detail.subcategory.name;

                    if (!categoryMap.has(categoryName)) {
                        categoryMap.set(categoryName, []);
                    }
                    categoryMap.get(categoryName)!.push(subcategoryName);
                }

                const categories = Array.from(categoryMap.entries()).map(
                    ([category, subcategories]) => ({
                        category,
                        subcategories,
                    }),
                );

                // Create response farm object
                const responseFarm: ResponseFarmDto = {
                    farm_id: product.farm.farm_id,
                    farm_name: product.farm.farm_name,
                    city: product.farm.address.city,
                    description: product.farm.description,
                    profile_image: product.farm.profile_image_urls,
                    avatar: product.farm.avatar_url,
                    certificate: product.farm.certificate_img_urls,
                    created: product.farm.created,
                    status: product.farm.status,
                };

                // Return formatted response product DTO
                return new ResponseProductDto({
                    ...product,
                    farm: responseFarm,
                    categories,
                });
            })
        );

        // Return paginated result with metadata
        return {
            items,
            totalItems,
            totalPages,
            currentPage: page
        };
    }


    // async getProductsByIds(ids: string[]): Promise<any[]> {
    //     const productIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
    //     if (productIds.length === 0) {
    //         return [];
    //     }

    //     const productEntities = await this.productsRepository.find({
    //         where: { product_id: In(productIds) },
    //         relations: ['farm'],
    //     });

    //     if (productEntities.length === 0) {
    //         return []; // Trả về mảng rỗng
    //     }
    //     const productEntityMap = new Map(productEntities.map(p => [p.product_id, p]));

    //     const farmIdsFromProducts = productEntities
    //         .map(p => p.farm?.farm_id)
    //         .filter(id => id !== undefined && id !== null) as string[];
    //     let farmsMap = new Map<string | number, Farm>();
    //     if (farmIdsFromProducts.length > 0) {
    //         const farmEntitiesFromService = await this.farmsService.findFarmsByIds(farmIdsFromProducts);
    //         farmsMap = new Map(farmEntitiesFromService.map(f => [f.farm_id, f]));
    //     }

    //     const foundProductIds = productEntities.map(p => p.product_id);
    //     // Giả sử categoriesService trả về ProductSubcategoryDetail[]
    //     const allSubcategoryDetails: ProductSubcategoryDetail[] = await this.categoriesService.findProductSubcategoryDetailsByProductIds(foundProductIds);

    //     const subcategoryDetailsByProductId = new Map<number, ProductSubcategoryDetail[]>();
    //     for (const detail of allSubcategoryDetails) {
    //         const detailProductId = detail.product?.product_id;
    //         if (detailProductId === undefined) continue;
    //         if (!subcategoryDetailsByProductId.has(detailProductId)) {
    //             subcategoryDetailsByProductId.set(detailProductId, []);
    //         }
    //         subcategoryDetailsByProductId.get(detailProductId)!.push(detail);
    //     }

    //     // Khởi tạo mảng để chứa các ResponseProductDto
    //     const results: Product[] = []; // Đặt tên là 'results' hoặc 'responseProductDtos'

    //     for (const originalProductId of productIds) {
    //         const productEntity = productEntityMap.get(originalProductId);
    //         if (!productEntity) continue;

    //         const farmEntity = productEntity.farm ? farmsMap.get(productEntity.farm.farm_id) : undefined;
    //         const responseFarm: Farm | undefined = farmEntity ? farmEntity : undefined;

    //         const productSpecificSubcategories = subcategoryDetailsByProductId.get(productEntity.product_id) || [];
    //         const categories = this.categoriesService.mapProductSubcategoryDetailsToCategoryDtos(productSpecificSubcategories);

    //         results.push(new Product());
    //     }
    //     this.logger.log(`(getProductsByIds) PRE-STRINGIFY: Found ${results.length} products.`);
    //     try {
    //         this.logger.log(`(getProductsByIds) STRINGIFYING: results content: ${JSON.stringify(results, null, 2)}`);
    //     } catch (e) {
    //         this.logger.error(`(getProductsByIds) ERROR DURING JSON.stringify: ${e.message}`);
    //         // Log một phần nhỏ hơn, an toàn hơn để xem cấu trúc
    //         if (results && results.length > 0) {
    //             this.logger.log(`(getProductsByIds) First result keys: ${Object.keys(results[0]).join(', ')}`);
    //         }
    //     }
    //     return results;
    // }

    async findProductById(
        productId: number,
        options?: {
            includeFarm?: boolean,
            includeSubcategoryDetails?: boolean,
            includeCategory?: boolean,
            includeAddress?: boolean,
            includeAddressGhn?: boolean,
        }
    ): Promise<Product | null> {
        const relationsToLoads: string[] = [];
        if (options?.includeFarm) {
            relationsToLoads.push('farm');
        }
        if (options?.includeSubcategoryDetails) {
            relationsToLoads.push('productSubcategoryDetails');
        }
        if (options?.includeCategory) {
            if (!relationsToLoads.includes('productSubcategoryDetails')) { // Kiểm tra và thêm nếu chưa có
                relationsToLoads.push('productSubcategoryDetails');
            }
            if (!relationsToLoads.includes('productSubcategoryDetails.subcategory')) { // Kiểm tra và thêm nếu chưa có
                relationsToLoads.push('productSubcategoryDetails.subcategory');
            }
            relationsToLoads.push('productSubcategoryDetails.subcategory.category');
        }
        // Tương tự cho address và address_ghn
        if (options?.includeAddress) {
            if (!relationsToLoads.includes('farm')) {
                relationsToLoads.push('farm');
            }
            relationsToLoads.push('farm.address');
        }
        if (options?.includeAddressGhn) {
            if (!relationsToLoads.includes('farm')) {
                relationsToLoads.push('farm');
            }
            if (!relationsToLoads.includes('farm.address')) {
                relationsToLoads.push('farm.address');
            }
            relationsToLoads.push('farm.address.address_ghn');
        }

        this.logger.log(`(findProductById) Đang tìm sản phẩm với ID: ${productId} và các quan hệ: ${relationsToLoads.join(', ')}`);
        const product = await this.productsRepository.findOne({
            where: { product_id: productId },
            relations: relationsToLoads,
        });
        if (!product) {
            this.logger.warn(`(findProductById) Không tìm thấy sản phẩm với ID: ${productId}`);
            return null;
        }
        this.logger.log(`(findProductById) Đã tìm thấy sản phẩm với ID: ${productId}`);
        this.logger.log(`(findProductById) Product details: ${JSON.stringify(product, null, 2)}`);
        return product;
    }

    async getProductById(id: string): Promise<ResponseProductDto> {
        const productId = Number(id);
        if (isNaN(productId)) {
            throw new BadRequestException('ID sản phẩm không hợp lệ');
        }

        const product: Product | null = await this.findProductById(productId, {
            includeFarm: true,
            includeSubcategoryDetails: true,
            includeCategory: true,
            includeAddress: true,
            includeAddressGhn: false,
        });
        if (!product) {
            this.logger.warn(`(getProductById) Sản phẩm không tồn tại với ID: ${productId}`);
            throw new NotFoundException(`Sản phẩm với ID ${productId} không tồn tại`);
        }

        // BỎ LOG PRODUCT ENTITY Ở ĐÂY VÌ SẼ CÓ LOG SAU KHI MAP (NẾU CẦN)
        // this.logger.log(`(getProductById) Đã tìm thấy sản phẩm với ID: ${productId}`);
        // this.logger.log(`(getProductById) Product details: ${JSON.stringify(productEntity, null, 2)}`);

        this.logger.log(`(getProductById) Đã lấy được ProductEntity ID ${product.product_id}, bắt đầu map...`);

        // GỌI HÀM MAP
        const responseDto = this.toResponseDto(product);

        this.logger.log(`(getProductById) Map thành công ProductEntity ID ${product.product_id} sang ResponseProductDto.`);
        // Bạn có thể log DTO đã map để kiểm tra nếu cần (cẩn thận nếu DTO lớn)
        this.logger.debug(`(getProductById) DTO sau khi map: ${JSON.stringify(responseDto, null, 2)}`);

        return responseDto;

    }

    // Hàm tĩnh để chuyển đổi Product entity sang ResponseProductDto
    private toResponseDto(product: Product): ResponseProductDto {


        // 1. Map Farm (bao gồm Address và AddressGhn nếu có)
        let farmDto: ResponseFarmDto | undefined = undefined;
        if (product.farm) {
            const farmEntity = product.farm as Farm;
            const partialFarmDto: Partial<ResponseFarmDto> = {
                farm_id: farmEntity.farm_id,
                farm_name: farmEntity.farm_name,
                city: farmEntity.address.city,
                description: farmEntity.description,

            };

            // if (farmEntity.address) {
            //     const addressEntity = farmEntity.address as Address;
            //     // Gán các trường từ addressEntity vào partialFarmDto
            //     // partialFarmDto.address_detail = addressEntity.address_detail;
            //     // partialFarmDto.ward_code = addressEntity.ward_code;
            //     // ...
            //     if (addressEntity.address_ghn) {
            //         const addressGhnEntity = addressEntity.address_ghn as AddressGhn;
            //         // Gán các trường từ addressGhnEntity vào partialFarmDto
            //         // partialFarmDto.ghn_province_id = addressGhnEntity.province_id;
            //         // ...
            //     }
            // }
            farmDto = new ResponseFarmDto(partialFarmDto);
        }

        // 2. Map Categories và Subcategories
        const categoriesData: { category: string; subcategories: string[] }[] = [];
        const categoriesMap = new Map<string, string[]>();

        if (product.productSubcategoryDetails && product.productSubcategoryDetails.length > 0) {
            for (const detail of product.productSubcategoryDetails as ProductSubcategoryDetail[]) {
                if (detail.subcategory && detail.subcategory.category) {
                    const categoryName = detail.subcategory.category.name;
                    const subcategoryName = detail.subcategory.name;
                    if (!categoriesMap.has(categoryName)) {
                        categoriesMap.set(categoryName, []);
                    }
                    categoriesMap.get(categoryName)!.push(subcategoryName);
                }
            }
            // Chuyển Map thành mảng theo cấu trúc DTO
            categoriesMap.forEach((subcategories, category) => {
                categoriesData.push({ category, subcategories });
            });
        }

        // 3. Tạo DTO chính
        const responseProductDto: ResponseProductDto = new ResponseProductDto({
            product_id: product.product_id,
            product_name: product.product_name,
            description: product.description,
            price_per_unit: typeof product.price_per_unit === 'string' ? parseFloat(product.price_per_unit) : product.price_per_unit,
            unit: product.unit,
            stock_quantity: product.stock_quantity,
            weight: product.weight,
            image_urls: product.image_urls || [],
            video_urls: product.video_urls || [],
            created: product.created,
            updated: product.updated,
            status: product.status,
            farm: farmDto,
            categories: categoriesData,
        });

        return responseProductDto;
    }


    async findProductsByIds(
        productIds: number[],
        options?: {
            includeFarm?: boolean;
            includeSubcategoryDetails?: boolean;
            includeCategory?: boolean;
            includeAddress?: boolean;
            includeAddressGhn?: boolean;
            includeIdentification?: boolean;
        }
    ): Promise<Product[]> {
        if (!productIds || productIds.length === 0) {
            this.logger.warn(`(findProductsByIds) Danh sách ID sản phẩm rỗng.`);
            return [];
        }
        const relationsToLoads: string[] = [];
        if (options?.includeFarm) {
            relationsToLoads.push('farm');
        }
        if (options?.includeSubcategoryDetails) {
            relationsToLoads.push('productSubcategoryDetails');
        }
        if (options?.includeCategory) {
            if (!relationsToLoads.includes('productSubcategoryDetails')) { // Kiểm tra và thêm nếu chưa có
                relationsToLoads.push('productSubcategoryDetails');
            }
            if (!relationsToLoads.includes('productSubcategoryDetails.subcategory')) { // Kiểm tra và thêm nếu chưa có
                relationsToLoads.push('productSubcategoryDetails.subcategory');
            }
            relationsToLoads.push('productSubcategoryDetails.subcategory.category');
        }
        if (options?.includeIdentification) {
            if (!relationsToLoads.includes('farm')) {
                relationsToLoads.push('farm');
            }
            relationsToLoads.push('farm.identification');
        }
        // Tương tự cho address và address_ghn
        if (options?.includeAddress) {
            if (!relationsToLoads.includes('farm')) {
                relationsToLoads.push('farm');
            }
            relationsToLoads.push('farm.address');
        }
        if (options?.includeAddressGhn) {
            if (!relationsToLoads.includes('farm')) {
                relationsToLoads.push('farm');
            }
            if (!relationsToLoads.includes('farm.address')) {
                relationsToLoads.push('farm.address');
            }
            relationsToLoads.push('farm.address.address_ghn');
        }

        const uniqueRelationsToLoad = [...new Set(relationsToLoads)];
        this.logger.log(`(findProductsByIds) Đang tìm sản phẩm với các ID: ${JSON.stringify(productIds)} và relations: ${JSON.stringify(uniqueRelationsToLoad)}`);
        const products = await this.productsRepository.find({
            where: { product_id: In(productIds) },
            relations: uniqueRelationsToLoad,
        });
        if (products.length === 0) {
            this.logger.warn(`(findProductsByIds) Không tìm thấy sản phẩm nào cho các ID: ${JSON.stringify(productIds)}`);
        } else {
            this.logger.log(`(findProductsByIds) Đã tìm thấy ${products.length} sản phẩm.`);
            this.logger.log(`(findProductsByIds) Product details: ${JSON.stringify(products, null, 2)}`);
        }
        return products;
    }

    async findProductsByFarmId(farmId: string): Promise<Product[]> {
        if (!farmId) {
            this.logger.warn(`(findProductsByFarmId) farmId không được cung cấp.`);
            return [];
        }
        this.logger.log(`(findProductsByFarmId) Đang tìm sản phẩm cho farm ID: ${farmId}`);
        const products = await this.productsRepository.find({
            where: { farm: { farm_id: farmId } },
            relations: ['farm', 'productSubcategoryDetails', 'productSubcategoryDetails.subcategory', 'productSubcategoryDetails.subcategory.category'],
        });
        if (products.length === 0) {
            this.logger.warn(`(findProductsByFarmId) Không tìm thấy sản phẩm nào cho farm ID: ${farmId}`);
        } else {
            this.logger.log(`(findProductsByFarmId) Đã tìm thấy ${products.length} sản phẩm cho farm ID: ${farmId}`);
            this.logger.log(`(findProductsByFarmId) Product details: ${JSON.stringify(products, null, 2)}`);
        }
        return products;
    }




}//