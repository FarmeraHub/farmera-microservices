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
        const categories = await this.categoriesRepository.find();

        const result = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await this.subcategoriesRepository.find({
                    where: { category: { category_id: category.category_id } },
                });

                return {
                    ...category,
                    subcategories,
                };
            }),
        );

        return result;
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

    async getSubcategoryById(id: number): Promise<Boolean> {
        const subcategory = await this.subcategoriesRepository.findOne({ where: { subcategory_id: id } });
        return !!subcategory; // Returns true if subcategory exists, otherwise false
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



}
