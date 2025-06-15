import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Category } from './entities/category.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateCategoriesDto } from './dto/request/create-categories.dto';
import { CreateSubcategoryDto } from './dto/request/create-subcategories.dto';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { SavedFileResult } from 'src/file-storage/storage.strategy.interface';
import { ProductSubcategoryDetail } from 'src/products/entities/product-subcategory-detail.entity';
import { CategoryDto } from './dto/response/category.dto.response';
import { CreateCategoryRequest, CreateCategoryResponse } from '@farmera/grpc-proto/dist/products/products';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { TypesMapper } from 'src/grpc/server/mappers/common/types.mapper';

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);
    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository: Repository<Category>,
        @InjectRepository(Subcategory)
        private readonly subcategoriesRepository: Repository<Subcategory>,
        @InjectRepository(ProductSubcategoryDetail)
        private readonly productSubcategoryDetailRepository: Repository<ProductSubcategoryDetail>,
        private readonly fileStorageService: FileStorageService,
        private readonly dataSource: DataSource, // Inject DataSource for transaction management
    ) { }
    async getCategoriesWithSubcategories() {
        const categories = await this.categoriesRepository.find(
            {
                relations: ['subcategories'],
                order: { created: 'DESC' },
            }
        );

        if (!categories || categories.length === 0) {
            this.logger.warn('Không tìm thấy danh mục nào.');
            return [];
        }


        return categories;
    }

    async getCategoryById(categoryId: number): Promise<Category> {
        const category = await this.categoriesRepository.findOne({
            where: { category_id: categoryId },
        });

        if (!category) {
            throw new NotFoundException(`Không tìm thấy danh mục với ID ${categoryId}`);
        }

        this.logger.log(`(getCategoryById) Lấy danh mục thành công: ${JSON.stringify(category, null, 2)}`);
        return category;
    }


    async createCategory(
        createCategoryDto: CreateCategoriesDto,
        file?: Express.Multer.File // File icon tùy chọn từ Multer
    ): Promise<Category> {
        let imageUrl: string | null = null;     // URL cuối cùng để lưu vào DB
        let savedFileData: SavedFileResult[] = []; // Lưu kết quả đầy đủ từ saveFiles để cleanup

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (file) {
                savedFileData = await this.fileStorageService.saveFiles([file], 'category_icon');

                this.logger.log(`(createCategory) Lưu icon thành công. Kết quả: ${JSON.stringify(savedFileData)}`);
                if (savedFileData && savedFileData.length > 0 && savedFileData[0]?.url) {
                    imageUrl = savedFileData[0].url; // Lấy URL
                } else {

                    throw new InternalServerErrorException("Không thể xử lý file icon đã upload.");
                }
            }

            const categoryData = {
                name: createCategoryDto.name,
                description: createCategoryDto.description,
                image_url: imageUrl || "",
            };

            const newCategory = queryRunner.manager.create(Category, categoryData);
            const savedCategory = await queryRunner.manager.save(Category, newCategory);

            await queryRunner.commitTransaction();
            return savedCategory;

        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (savedFileData.length > 0) {
                await this.fileStorageService.cleanupFiles(savedFileData);
            }

            if (file?.path) {
                await this.fileStorageService.deleteFilesByIdentifier([file.path])
                    .catch(e => this.logger.error(`(createCategory) Lỗi khi xóa file tạm ${file.path}: ${e.message}`));
            }

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể tạo category: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }
    async createSubcategory(createSub: CreateSubcategoryDto): Promise<Subcategory> {
        const existingSubcategory = await this.categoriesRepository.findOne({ where: { category_id: createSub.category_id } });
        if (!existingSubcategory) {
            throw new NotFoundException('Không tìm thấy danh mục với category_id đã cung cấp');
        }
        const subcategory = this.subcategoriesRepository.create({
            ...createSub,
            category: existingSubcategory,  // Lưu category_id vào subcategory
        });
        return this.subcategoriesRepository.save(subcategory);
    }

    async checkSubcategoryById(id: number): Promise<Boolean> {
        const subcategory = await this.subcategoriesRepository.findOne({ where: { subcategory_id: id } });
        return !!subcategory; // Returns true if subcategory exists, otherwise false
    }
    async getSubcategoryById(id: number): Promise<Subcategory> {
        const subcategory = await this.subcategoriesRepository.findOne({
            where: { subcategory_id: id },
            relations: ['category'], // Lấy thông tin category liên quan
        });
        if (!subcategory) {
            throw new NotFoundException(`Không tìm thấy danh mục con với ID ${id}`);
        }
        return subcategory;
    }

    async findProductSubcategoryDetailsByProductIds(productIds: number[]): Promise<ProductSubcategoryDetail[]> {
        if (!productIds || productIds.length === 0) {
            return [];
        }
        return this.productSubcategoryDetailRepository.find({
            where: { product: { product_id: In(productIds) } },
            relations: [
                'product',
                'subcategory',
                'subcategory.category',
            ],
        });
    }

    // Phương thức helper để map ProductSubcategoryDetail[] sang CategoryDto[]
    // Bạn có thể đặt hàm này ở đây hoặc trong một mapper riêng nếu logic phức tạp
    mapProductSubcategoryDetailsToCategoryDtos(details: ProductSubcategoryDetail[]): CategoryDto[] {
        if (!details || details.length === 0) {
            return [];
        }
        const categoryMap = new Map<string, string[]>();
        for (const detail of details) {
            if (detail.subcategory && detail.subcategory.category &&
                detail.subcategory.category.name && detail.subcategory.name) {
                const categoryName = detail.subcategory.category.name;
                const subcategoryName = detail.subcategory.name;

                if (!categoryMap.has(categoryName)) {
                    categoryMap.set(categoryName, []);
                }
                categoryMap.get(categoryName)!.push(subcategoryName);
            }
        }
        return Array.from(categoryMap.entries()).map(
            ([category, subcategories]) => ({
                category,
                subcategories,
            }),
        );
    }

    async createCategoryForGrpc(request: CreateCategoryRequest): Promise<CreateCategoryResponse> {
        this.logger.log(`[gRPC In - CreateCategory] Received request: name=${request.name}, hasIcon=${!!request.category_icon_data?.length}`);

        if (!request.name || request.name.trim() === '') {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Category name is required.',
            });
        }
        let imageUrl: string | null = null;
        let savedFileData: SavedFileResult[] = [];
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (request.category_icon_data && request.category_icon_data.length > 0) {
                const syntheticFile = {
                    buffer: Buffer.from(request.category_icon_data),
                    originalname: request.icon_filename || `category_icon_${Date.now()}`,
                    mimetype: request.icon_mime_type || 'application/octet-stream',

                    fieldname: 'category_icon_data',
                    encoding: '7bit',
                    size: request.category_icon_data.length,
                    destination: '',
                    filename: request.icon_filename || `category_icon_${Date.now()}`,
                    path: '',
                    stream: null as any,
                } as Express.Multer.File;
                savedFileData = await this.fileStorageService.saveFiles([syntheticFile], 'category_icon');

                this.logger.log(`(gRPC createCategory) Lưu icon thành công. Kết quả: ${JSON.stringify(savedFileData)}`);
                if (savedFileData && savedFileData.length > 0 && savedFileData[0]?.url) {
                    imageUrl = savedFileData[0].url;
                } else {
                    this.logger.error("Không thể xử lý file icon đã upload qua gRPC.");
                    throw new RpcException({
                        code: status.INTERNAL,
                        message: "Không thể xử lý file icon đã cung cấp.",
                    });
                }
            }


            const categoryDataForDb = {
                name: request.name,
                description: request.description || undefined,
                image_url: imageUrl || "",
            };

            const newCategory = queryRunner.manager.create(Category, categoryDataForDb);
            const savedCategoryEntity = await queryRunner.manager.save(Category, newCategory);

            await queryRunner.commitTransaction();

            this.logger.log(`(gRPC createCategory) Category created successfully: ID ${savedCategoryEntity.category_id}`);

            const grpcCategoryResponse: CreateCategoryResponse = {
                category: {
                    category_id: savedCategoryEntity.category_id,
                    name: savedCategoryEntity.name,
                    description: savedCategoryEntity.description || '',
                    image_url: savedCategoryEntity.image_url || '',
                    created: TypesMapper.toGrpcTimestamp(savedCategoryEntity.created),
                },
            };
            return grpcCategoryResponse;

        } catch (error) {
            await queryRunner.rollbackTransaction();

            // Dọn dẹp file đã lưu nếu có lỗi xảy ra sau khi lưu file
            if (savedFileData.length > 0) {
                this.logger.warn(`(gRPC createCategory) Rolling back transaction, attempting to cleanup files: ${JSON.stringify(savedFileData.map(f => f.identifier))}`);
                await this.fileStorageService.cleanupFiles(savedFileData)
                    .catch(e => this.logger.error(`(gRPC createCategory) Lỗi khi cleanup file: ${e.message}`));
            }

            this.logger.error(`(gRPC createCategory) Lỗi khi tạo category: ${error.message}`, error.stack);

            if (error instanceof RpcException) {
                throw error;
            }


            throw new RpcException({
                code: status.INTERNAL,
                message: `Không thể tạo category: ${error.message}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

}
