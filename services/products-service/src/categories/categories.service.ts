import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { CreateSubcategoryDto } from './dto/create-subcategories.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMeta } from 'src/pagination/dto/pagination-meta.dto';

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);

    constructor(
        @InjectRepository(Category)
        private readonly categoriesRepository: Repository<Category>,
        @InjectRepository(Subcategory)
        private readonly subcategoriesRepository: Repository<Subcategory>,
    ) { }

    async getCategoriesWithSubcategories(
        paginationOptions?: PaginationOptions,
    ): Promise<PaginationResult<Category> | Category[]> {
        // If no pagination options provided, return all categories (for backward compatibility)
        if (!paginationOptions) {
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

        // Use pagination
        const queryBuilder = this.categoriesRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.subcategories', 'subcategories')
            .orderBy(
                'category.created',
                (paginationOptions.order || 'DESC') as 'ASC' | 'DESC',
            );

        // Add sorting if specified
        if (paginationOptions.sort_by) {
            const order = (paginationOptions.order || 'ASC') as 'ASC' | 'DESC';
            switch (paginationOptions.sort_by) {
                case 'name':
                    queryBuilder.orderBy('category.name', order);
                    break;
                case 'created':
                    queryBuilder.orderBy('category.created', order);
                    break;
                default:
                    queryBuilder.orderBy('category.created', 'DESC');
            }
        }

        // If all=true, return all results without pagination
        if (paginationOptions.all) {
            const categories = await queryBuilder.getMany();
            return categories;
        }

        // Apply pagination
        const totalItems = await queryBuilder.getCount();
        const categories = await queryBuilder
            .skip(paginationOptions.skip)
            .take(paginationOptions.limit)
            .getMany();

        const meta = new PaginationMeta({
            paginationOptions,
            totalItems,
        });

        return new PaginationResult(categories, meta);
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
        try {
            return this.categoriesRepository.create(createCategoryDto);
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Không thể tạo category: ${error.message}`);
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

    // verified
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
