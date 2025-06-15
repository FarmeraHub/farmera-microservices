import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryService } from './category.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('category')
export class CategoryController {

    constructor(private readonly categoryService: CategoryService) { }

    // Is admin
    @Post("create")
    async createCategory(@Body() newCategory: CreateCategoryDto) {
        return await this.categoryService.createCategory(newCategory);
    }

    @Post("subcategory/create")
    async createSubCategory(@Body() newSubCategory: CreateSubcategoryDto) {
        return await this.categoryService.createSubcategoryDto(newSubCategory);
    }

    @Public()
    @Get("with-subs/:id")
    async getCategoryTree(@Param("id") id: number) {
        return await this.categoryService.getCategoryTree(id);
    }

    @Public()
    @Get(":id")
    async getCategory(@Param("id") id: number) {
        return await this.categoryService.getCategory(id);
    }

    @Public()
    @Get("/subcategory/:id")
    async getSubcategory(@Param("id") id: number) {
        return await this.categoryService.getSubCategory(id);
    }
}
