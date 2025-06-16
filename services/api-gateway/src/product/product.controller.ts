import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  User as UserInterface,
  UserRole,
} from '../common/interfaces/user.interface';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductsDto,
  CreateCategoryDto,
  CreateSubcategoryDto,
  RegisterFarmDto,
  UpdateFarmDto,
  FarmFiltersDto,
  UpdateFarmStatusDto,
  PaginationQueryDto,
} from './dto';
import { ProductIdsDto } from './dto/product/product-ids.dto';

@ApiTags('Products & Farms')
@Controller('products')
export class ProductController {
  // private readonly logger = new Logger(ProductController.name);

  // constructor(private readonly productService: ProductService) {}

  // @Get()
  // @ApiOperation({ summary: 'Search and filter products with pagination' })
  // @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  // @ResponseMessage('Products retrieved successfully')
  // async searchProducts(@Query() searchDto: SearchProductsDto) {
  //   this.logger.log(
  //     `Searching products with filters: ${JSON.stringify(searchDto)}`,
  //   );

  //   try {
  //     return await this.productService.searchProducts(searchDto);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error searching products: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to search products');
  //   }
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get product by ID' })
  // @ApiParam({ name: 'id', description: 'Product ID' })
  // @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  // @ResponseMessage('Product retrieved successfully')
  // async getProduct(@Param('id', ParseIntPipe) id: number) {
  //   this.logger.log(`Getting product with ID: ${id}`);

  //   try {
  //     return await this.productService.getProductById(id);
  //   } catch (error) {
  //     this.logger.error(`Error getting product: ${error.message}`, error.stack);
  //     throw new BadRequestException('Failed to retrieve product');
  //   }
  // }

  // @Post()
  // @ApiOperation({ summary: 'Create new product' })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({ status: 201, description: 'Product created successfully' })
  // @ResponseMessage('Product created successfully')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'product_images', maxCount: 5 },
  //     { name: 'product_videos', maxCount: 2 },
  //   ]),
  // )
  // async createProduct(
  //   @User() user: UserInterface,
  //   @Body() createProductDto: CreateProductDto,
  //   @UploadedFiles()
  //   files: {
  //     product_images?: Express.Multer.File[];
  //     product_videos?: Express.Multer.File[];
  //   },
  // ) {
  //   this.logger.log(`Creating product for user: ${user.id}`);

  //   // Only farmers and admins can create products
  //   if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException(
  //       'Only farmers and admins can create products',
  //     );
  //   }

  //   try {
  //     return await this.productService.createProduct(
  //       createProductDto,
  //       user.id,
  //       files,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error creating product: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to create product');
  //   }
  // }

  // @Put(':id')
  // @ApiOperation({ summary: 'Update product by ID' })
  // @ApiParam({ name: 'id', description: 'Product ID' })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({ status: 200, description: 'Product updated successfully' })
  // @ResponseMessage('Product updated successfully')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'product_images', maxCount: 5 },
  //     { name: 'product_videos', maxCount: 2 },
  //   ]),
  // )
  // async updateProduct(
  //   @User() user: UserInterface,
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateProductDto: UpdateProductDto,
  //   @UploadedFiles()
  //   files: {
  //     product_images?: Express.Multer.File[];
  //     product_videos?: Express.Multer.File[];
  //   },
  // ) {
  //   this.logger.log(`Updating product ${id} for user: ${user.id}`);

  //   // Only farmers and admins can update products
  //   if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException(
  //       'Only farmers and admins can update products',
  //     );
  //   }

  //   try {
  //     return await this.productService.updateProduct(
  //       id,
  //       updateProductDto,
  //       user.id,
  //       files,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error updating product: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to update product');
  //   }
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete product by ID' })
  // @ApiParam({ name: 'id', description: 'Product ID' })
  // @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  // @ResponseMessage('Product deleted successfully')
  // async deleteProduct(
  //   @User() user: UserInterface,
  //   @Param('id', ParseIntPipe) id: number,
  // ) {
  //   this.logger.log(`Deleting product ${id} for user: ${user.id}`);

  //   // Only farmers and admins can delete products
  //   if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException(
  //       'Only farmers and admins can delete products',
  //     );
  //   }

  //   try {
  //     return await this.productService.deleteProduct(id, user.id);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error deleting product: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to delete product');
  //   }
  // }

  // @Post('bulk')
  // @ApiOperation({ summary: 'Get multiple products by IDs' })
  // @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  // @ResponseMessage('Products retrieved successfully')
  // async getProductsByIds(@Body() productIdsDto: ProductIdsDto) {
  //   this.logger.log(
  //     `Getting products by IDs: ${productIdsDto.product_ids.join(', ')}`,
  //   );

  //   try {
  //     return await this.productService.getProductsByIds(
  //       productIdsDto.product_ids,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting products by IDs: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to retrieve products');
  //   }
  // }

  // @Get('categories')
  // @ApiOperation({ summary: 'Get all categories with subcategories' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Categories retrieved successfully',
  // })
  // @ResponseMessage('Categories retrieved successfully')
  // async getCategories(@Query() paginationDto: PaginationQueryDto) {
  //   this.logger.log('Getting all categories with subcategories');

  //   try {
  //     return await this.productService.getAllCategories();
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting categories: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to retrieve categories');
  //   }
  // }

  // @Get('categories/:id')
  // @ApiOperation({ summary: 'Get category by ID' })
  // @ApiParam({ name: 'id', description: 'Category ID' })
  // @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  // @ResponseMessage('Category retrieved successfully')
  // async getCategory(@Param('id', ParseIntPipe) id: number) {
  //   this.logger.log(`Getting category with ID: ${id}`);

  //   try {
  //     return await this.productService.getCategoryById(id);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting category: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to retrieve category');
  //   }
  // }

  // @Post('categories')
  // @ApiOperation({ summary: 'Create new category' })
  // @ApiResponse({ status: 201, description: 'Category created successfully' })
  // @ResponseMessage('Category created successfully')
  // async createCategory(
  //   @User() user: UserInterface,
  //   @Body() createCategoryDto: CreateCategoryDto,
  // ) {
  //   this.logger.log(`Creating category for user: ${user.id}`);

  //   // Only admins can create categories
  //   if (user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException('Only admins can create categories');
  //   }

  //   try {
  //     return await this.productService.createCategory(createCategoryDto);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error creating category: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to create category');
  //   }
  // }

  // @Get('subcategories/:id')
  // @ApiOperation({ summary: 'Get subcategory by ID' })
  // @ApiParam({ name: 'id', description: 'Subcategory ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Subcategory retrieved successfully',
  // })
  // @ResponseMessage('Subcategory retrieved successfully')
  // async getSubcategory(@Param('id', ParseIntPipe) id: number) {
  //   this.logger.log(`Getting subcategory with ID: ${id}`);

  //   try {
  //     return await this.productService.getSubcategoryById(id);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting subcategory: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to retrieve subcategory');
  //   }
  // }

  // @Post('subcategories')
  // @ApiOperation({ summary: 'Create new subcategory' })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Subcategory created successfully',
  // })
  // @ResponseMessage('Subcategory created successfully')
  // async createSubcategory(
  //   @User() user: UserInterface,
  //   @Body() createSubcategoryDto: CreateSubcategoryDto,
  // ) {
  //   this.logger.log(`Creating subcategory for user: ${user.id}`);

  //   // Only admins can create subcategories
  //   if (user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException('Only admins can create subcategories');
  //   }

  //   try {
  //     return await this.productService.createSubcategory(createSubcategoryDto);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error creating subcategory: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to create subcategory');
  //   }
  // }

  // @Get('farms')
  // @ApiOperation({ summary: 'Get farms with filters and pagination' })
  // @ApiResponse({ status: 200, description: 'Farms retrieved successfully' })
  // @ResponseMessage('Farms retrieved successfully')
  // async getFarms(@Query() farmFiltersDto: FarmFiltersDto) {
  //   this.logger.log(
  //     `Getting farms with filters: ${JSON.stringify(farmFiltersDto)}`,
  //   );

  //   try {
  //     return await this.productService.getFarms(farmFiltersDto);
  //   } catch (error) {
  //     this.logger.error(`Error getting farms: ${error.message}`, error.stack);
  //     throw new BadRequestException('Failed to retrieve farms');
  //   }
  // }

  // @Get('farms/:id')
  // @ApiOperation({ summary: 'Get farm by ID' })
  // @ApiParam({ name: 'id', description: 'Farm ID' })
  // @ApiResponse({ status: 200, description: 'Farm retrieved successfully' })
  // @ResponseMessage('Farm retrieved successfully')
  // async getFarm(
  //   @Param('id') id: string,
  //   @Query('include_products') includeProducts?: boolean,
  // ) {
  //   this.logger.log(`Getting farm with ID: ${id}`);

  //   try {
  //     return await this.productService.getFarmById(
  //       id,
  //       includeProducts || false,
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error getting farm: ${error.message}`, error.stack);
  //     throw new BadRequestException('Failed to retrieve farm');
  //   }
  // }

  // @Get('farms/my/farm')
  // @ApiOperation({ summary: 'Get current user farm' })
  // @ApiResponse({ status: 200, description: 'Farm retrieved successfully' })
  // @ResponseMessage('Farm retrieved successfully')
  // async getMyFarm(
  //   @User() user: UserInterface,
  //   @Query('include_products') includeProducts?: boolean,
  // ) {
  //   this.logger.log(`Getting farm for user: ${user.id}`);

  //   try {
  //     return await this.productService.getFarmByUserId(
  //       user.id,
  //       includeProducts || false,
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error getting farm: ${error.message}`, error.stack);
  //     throw new BadRequestException('Failed to retrieve farm');
  //   }
  // }

  // @Post('farms')
  // @ApiOperation({ summary: 'Register new farm' })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({ status: 201, description: 'Farm registered successfully' })
  // @ResponseMessage('Farm registered successfully')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'cccd', maxCount: 2 },
  //     { name: 'biometric_video', maxCount: 1 },
  //   ]),
  // )
  // async registerFarm(
  //   @User() user: UserInterface,
  //   @Body() registerFarmDto: RegisterFarmDto,
  //   @UploadedFiles()
  //   files: {
  //     cccd?: Express.Multer.File[];
  //     biometric_video?: Express.Multer.File[];
  //   },
  // ) {
  //   this.logger.log(`Registering farm for user: ${user.id}`);

  //   try {
  //     return await this.productService.createFarm(
  //       registerFarmDto,
  //       user.id,
  //       files,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error registering farm: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to register farm');
  //   }
  // }

  // @Put('farms/:id')
  // @ApiOperation({ summary: 'Update farm by ID' })
  // @ApiParam({ name: 'id', description: 'Farm ID' })
  // @ApiConsumes('multipart/form-data')
  // @ApiResponse({ status: 200, description: 'Farm updated successfully' })
  // @ResponseMessage('Farm updated successfully')
  // @UseInterceptors(
  //   FileFieldsInterceptor([
  //     { name: 'avatar', maxCount: 1 },
  //     { name: 'profile_images', maxCount: 5 },
  //     { name: 'certificate_images', maxCount: 5 },
  //   ]),
  // )
  // async updateFarm(
  //   @User() user: UserInterface,
  //   @Param('id') id: string,
  //   @Body() updateFarmDto: UpdateFarmDto,
  //   @UploadedFiles()
  //   files: {
  //     avatar?: Express.Multer.File[];
  //     profile_images?: Express.Multer.File[];
  //     certificate_images?: Express.Multer.File[];
  //   },
  // ) {
  //   this.logger.log(`Updating farm ${id} for user: ${user.id}`);

  //   try {
  //     return await this.productService.updateFarm(
  //       id,
  //       updateFarmDto,
  //       user.id,
  //       files,
  //     );
  //   } catch (error) {
  //     this.logger.error(`Error updating farm: ${error.message}`, error.stack);
  //     throw new BadRequestException('Failed to update farm');
  //   }
  // }

  // @Put('farms/:id/status')
  // @ApiOperation({ summary: 'Update farm status (Admin only)' })
  // @ApiParam({ name: 'id', description: 'Farm ID' })
  // @ApiResponse({ status: 200, description: 'Farm status updated successfully' })
  // @ResponseMessage('Farm status updated successfully')
  // async updateFarmStatus(
  //   @User() user: UserInterface,
  //   @Param('id') id: string,
  //   @Body() updateStatusDto: UpdateFarmStatusDto,
  // ) {
  //   this.logger.log(`Updating farm status for farm: ${id}`);

  //   // Only admins can update farm status
  //   if (user.role !== UserRole.ADMIN) {
  //     throw new ForbiddenException('Only admins can update farm status');
  //   }

  //   try {
  //     return await this.productService.updateFarmStatus(
  //       id,
  //       updateStatusDto,
  //       user.id,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       `Error updating farm status: ${error.message}`,
  //       error.stack,
  //     );
  //     throw new BadRequestException('Failed to update farm status');
  //   }
  // }
}
