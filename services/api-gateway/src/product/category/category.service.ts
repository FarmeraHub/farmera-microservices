import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { CreateCategoryDto } from './dto/create-category.dto';
import { firstValueFrom } from 'rxjs';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { Category } from './entities/category.entity';
import { CategoryMapper } from 'src/mappers/product/category.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { PaginationMapper } from 'src/mappers/common/pagination.mapper';
import { PaginationResult } from '../../pagination/dto/pagination-result.dto';
import { SearchCategoryDto } from './dto/search-categories.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';

@Injectable()
export class CategoryService implements OnModuleInit {
    private readonly logger = new Logger(CategoryService.name);
    private productGrpcService: ProductsServiceClient;

    constructor(
        @Inject("PRODUCTS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.productGrpcService = this.client.getService<ProductsServiceClient>("ProductsService")
    }

    async createCategory(newCategory: CreateCategoryDto): Promise<Category> {
        try {
            const result = await firstValueFrom(this.productGrpcService.createCategory({
                name: newCategory.name,
                description: newCategory.description,
                category_icon_url: newCategory.icon_url,
            }));

            return CategoryMapper.fromGrpcCategory(result.category);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async createSubcategoryDto(newSubCategory: CreateSubcategoryDto) {
        try {
            const result = await firstValueFrom(this.productGrpcService.createSubcategory({
                name: newSubCategory.name,
                description: newSubCategory.description,
                category_id: newSubCategory.category_id,
            }));

            return CategoryMapper.fromGrpcSubcategory(result.subcategory);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getCategory(id: number) {
        try {
            const result = await firstValueFrom(this.productGrpcService.getCategory({
                category_id: id
            }));

            return CategoryMapper.fromGrpcCategory(result.category);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getSubCategory(id: number) {
        try {
            const result = await firstValueFrom(this.productGrpcService.getSubcategory({
                subcategory_id: id
            }));

            return CategoryMapper.fromGrpcSubcategory(result.subcategory);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getCategoryTree(categoryId: number) {
        try {
            const result = await firstValueFrom(this.productGrpcService.getCategoryTree({
                category_id: categoryId
            }));

            return CategoryMapper.fromGetCategoryTreeResponse(result);
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getAllCategories(paginationDto: PaginationOptions): Promise<PaginationResult<Category>> {
        try {
            const result = await firstValueFrom(this.productGrpcService.getAllCategoryWithSubcategory({
                pagination: PaginationMapper.toGrpcPaginationRequest(paginationDto)
            }));
            return {
                data: result.category.map((value) => CategoryMapper.fromGrpcCategoryWithSubs(value)),
                pagination: PaginationMapper.fromGrpcPaginationResponse(result.pagination)
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);

        }
    }

    async searchCategory(searchDto: SearchCategoryDto): Promise<PaginationResult<Category>> {
        try {
            const pagination = plainToInstance(PaginationOptions, searchDto);
            const result = await firstValueFrom(this.productGrpcService.searchCategory({
                name: searchDto.query,
                pagination: PaginationMapper.toGrpcPaginationRequest(pagination)
            }));
            return {
                data: result.category.map((value) => CategoryMapper.fromGrpcCategoryWithSubs(value)),
                pagination: PaginationMapper.fromGrpcPaginationResponse(result.pagination)
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);

        }
    }
}
