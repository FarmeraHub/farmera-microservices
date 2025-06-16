import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Category } from './entities/category.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateCategoriesDto } from './dto/request/create-categories.dto';
import { CreateSubcategoryDto } from './dto/request/create-subcategories.dto';

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);
    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository: Repository<Category>,
        @InjectRepository(Subcategory)
        private readonly subcategoriesRepository: Repository<Subcategory>,
        // @InjectRepository(ProductSubcategoryDetail)
        // private readonly productSubcategoryDetailRepository: Repository<ProductSubcategoryDetail>,
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


    // verified
    async createCategory(
        createCategoryDto: CreateCategoriesDto,
    ): Promise<Category> {

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const categoryData = {
                name: createCategoryDto.name,
                description: createCategoryDto.description,
                image_url: createCategoryDto.icon_url,
            };

            const newCategory = queryRunner.manager.create(Category, categoryData);
            const savedCategory = await queryRunner.manager.save(Category, newCategory);

            await queryRunner.commitTransaction();
            return savedCategory;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể tạo category: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    // verified
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

    // async findProductSubcategoryDetailsByProductIds(productIds: number[]): Promise<ProductSubcategoryDetail[]> {
    //     if (!productIds || productIds.length === 0) {
    //         return [];
    //     }
    //     return this.productSubcategoryDetailRepository.find({
    //         where: { product: { product_id: In(productIds) } },
    //         relations: [
    //             'product',
    //             'subcategory',
    //             'subcategory.category',
    //         ],
    //     });
    // }

    // verified
    async getSubCategoryTree(category_id: number): Promise<Category> {
        const category = await this.categoriesRepository.findOne({ where: { category_id: category_id } });
        if (!category) {
            throw new NotFoundException(`Không tìm thất danh mục với ID ${category_id}`);
        }
        const subcategories = await this.subcategoriesRepository.find({
            where: {
                category: { category_id: category_id }
            },
            order: {
                subcategory_id: "ASC"
            }
        });

        category.subcategories = subcategories;

        return category;
    }
}
