import { Body, Get, Controller, Post, UploadedFile, UseGuards, UseInterceptors, Request, UnauthorizedException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';

import { Role } from 'src/common/enums/role.enum';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { CreateSubcategoryDto } from './dto/create-subcategories.dto';


@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }


  @Post('create')
  @UseInterceptors(FileInterceptor('category_icon'))
  async create(
    @Body() categoriesDto: CreateCategoriesDto,
    @Request() req: Request,
    @UploadedFile() file?: Express.Multer.File,

  ) {
    const userId = req.headers['x-user-id'];
      const role = req.headers['x-user-role'];
    if (!(role == Role.ADMIN)) {
      throw new UnauthorizedException('Không có quyền tạo danh mục con');
    }
    console.log('createCategoriesDto: ', categoriesDto);
    console.log('files: ', file);
    // @Body() createCategoryDto: CreateCategoriesDto
    return this.categoriesService.createCategory(categoriesDto, file);
  }
  @Get('getall')
  async getAllCategories() {
    return this.categoriesService.getCategoriesWithSubcategories();
  }

  
  @Post('sub/create')
  async createSubcategory(
    @Request() req: Request,
    @Body() createSubcategoryDto: CreateSubcategoryDto) {
      const userId = req.headers['x-user-id'];
      const role = req.headers['x-user-role'];
      if (!(role == Role.ADMIN)) {
        throw new UnauthorizedException('Không có quyền tạo danh mục con');
      }
    return this.categoriesService.createSubcategory(createSubcategoryDto);
  }
}
