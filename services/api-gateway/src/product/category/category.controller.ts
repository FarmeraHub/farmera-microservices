import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryService } from './category.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { SearchCategoryDto } from './dto/search-categories.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces/user.interface';

@Controller('category')
export class CategoryController {

    constructor(private readonly categoryService: CategoryService) { }

    @Roles(UserRole.ADMIN)
    @Post("create")
    async createCategory(@Body() newCategory: CreateCategoryDto) {
        return await this.categoryService.createCategory(newCategory);
    }

    @Roles(UserRole.ADMIN)
    @Post("subcategory/create")
    async createSubCategory(@Body() newSubCategory: CreateSubcategoryDto) {
        return await this.categoryService.createSubcategoryDto(newSubCategory);
    }

    @Public()
    @Get("with-subs/:id")
    async getCategoryTree(@Param("id", ParseIntPipe) id: number) {
        return await this.categoryService.getCategoryTree(id);
    }

    @Public()
    @Get("/subcategory/:id")
    async getSubcategory(@Param("id", ParseIntPipe) id: number) {
        return await this.categoryService.getSubCategory(id);
    }

    @ApiOperation({ summary: 'Get all categories with subcategories' })
    @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
    @ResponseMessage('Categories retrieved successfully')
    @Public()
    @Get('all')
    async getCategories(@Query() paginationDto: PaginationOptions) {
        return await this.categoryService.getAllCategories(paginationDto);
    }

    @Public()
    @Get("search")
    async seachCategory(@Query() searchDto: SearchCategoryDto) {
        return await this.categoryService.searchCategory(searchDto);
    }

    @Public()
    @Get(":id")
    async getCategory(@Param("id", ParseIntPipe) id: number) {
        return await this.categoryService.getCategory(id);
    }
}
