import { Body, Get, Controller, Post, UploadedFile, UseGuards, UseInterceptors, Request, UnauthorizedException, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/request/create-categories.dto';
import { Role } from 'src/common/enums/role.enum';
import { CreateSubcategoryDto } from './dto/request/create-subcategories.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }
  @Post('create')
  async create(
    @Body() categoriesDto: CreateCategoriesDto,
    @Request() req: Request,
  ) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    if (!(role == Role.ADMIN)) {
      throw new UnauthorizedException('Không có quyền tạo danh mục con');
    }
    // @Body() createCategoryDto: CreateCategoriesDto
    return this.categoriesService.createCategory(categoriesDto);
  }

  @Get('getall')
  async getAllCategories(@Query() paginationOptions?: PaginationOptions) {
    return this.categoriesService.getCategoriesWithSubcategories(
      paginationOptions,
    );
  }

  @Post('sub/create')
  async createSubcategory(
    @Request() req: Request,
    @Body() createSubcategoryDto: CreateSubcategoryDto,
  ) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    if (!(role == Role.ADMIN)) {
      throw new UnauthorizedException('Không có quyền tạo danh mục con');
    }
    return this.categoriesService.createSubcategory(createSubcategoryDto);
  }
}
