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
import { ProductClientService } from './product.client.service';
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
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productClientService: ProductClientService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter products with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ResponseMessage('Products retrieved successfully')
  async searchProducts(@Query() searchDto: SearchProductsDto) {
    this.logger.log(
      `Searching products with filters: ${JSON.stringify(searchDto)}`,
    );

    try {
      const result = await firstValueFrom(
        this.productClientService.searchProducts({
          search: searchDto.search,
          category: searchDto.category,
          subcategory: searchDto.subcategory,
          min_price: searchDto.minPrice,
          max_price: searchDto.maxPrice,
          farm_id: searchDto.farmId,
          status: searchDto.status,
          page: searchDto.page,
          limit: searchDto.limit,
          sort_by: searchDto.sort_by,
          order: searchDto.order,
          all: searchDto.all,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching products: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to search products');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ResponseMessage('Product retrieved successfully')
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Getting product with ID: ${id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getProduct(id),
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting product: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ResponseMessage('Product created successfully')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'product_images', maxCount: 5 },
      { name: 'product_videos', maxCount: 2 },
    ]),
  )
  async createProduct(
    @User() user: UserInterface,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      product_images?: Express.Multer.File[];
      product_videos?: Express.Multer.File[];
    },
  ) {
    this.logger.log(`Creating product for user: ${user.id}`);

    // Only farmers and admins can create products
    if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only farmers and admins can create products',
      );
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.createProduct({
          ...createProductDto,
          user_id: user.id,
          files,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error creating product: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create product');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ResponseMessage('Product updated successfully')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'product_images', maxCount: 5 },
      { name: 'product_videos', maxCount: 2 },
    ]),
  )
  async updateProduct(
    @User() user: UserInterface,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      product_images?: Express.Multer.File[];
      product_videos?: Express.Multer.File[];
    },
  ) {
    this.logger.log(`Updating product ${id} for user: ${user.id}`);

    // Only farmers and admins can update products
    if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only farmers and admins can update products',
      );
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.updateProduct(id, {
          ...updateProductDto,
          user_id: user.id,
          files,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating product: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update product');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ResponseMessage('Product deleted successfully')
  async deleteProduct(
    @User() user: UserInterface,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`Deleting product ${id} for user: ${user.id}`);

    // Only farmers and admins can delete products
    if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only farmers and admins can delete products',
      );
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.deleteProduct(id, user.id),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting product: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to delete product');
    }
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Get multiple products by IDs' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ResponseMessage('Products retrieved successfully')
  async getProductsByIds(@Body() productIdsDto: ProductIdsDto) {
    this.logger.log(
      `Getting products by IDs: ${productIdsDto.product_ids.join(', ')}`,
    );

    try {
      const result = await firstValueFrom(
        this.productClientService.getListProducts(productIdsDto.product_ids),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting products by IDs: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with subcategories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ResponseMessage('Categories retrieved successfully')
  async getCategories(@Query() paginationDto: PaginationQueryDto) {
    this.logger.log('Getting all categories with subcategories');

    try {
      const result = await firstValueFrom(
        this.productClientService.getAllCategoryWithSubcategory(),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting categories: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve categories');
    }
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ResponseMessage('Category retrieved successfully')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Getting category with ID: ${id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getCategory(id),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve category');
    }
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new category (Admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ResponseMessage('Category created successfully')
  async createCategory(
    @User() user: UserInterface,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    this.logger.log(`Creating category for admin: ${user.id}`);

    // Only admins can create categories
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create categories');
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.createCategory(createCategoryDto),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create category');
    }
  }

  @Get('subcategories/:id')
  @ApiOperation({ summary: 'Get subcategory by ID' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  @ApiResponse({
    status: 200,
    description: 'Subcategory retrieved successfully',
  })
  @ResponseMessage('Subcategory retrieved successfully')
  async getSubcategory(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Getting subcategory with ID: ${id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getSubcategory(id),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting subcategory: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve subcategory');
    }
  }

  @Post('subcategories')
  @ApiOperation({ summary: 'Create new subcategory (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully' })
  @ResponseMessage('Subcategory created successfully')
  async createSubcategory(
    @User() user: UserInterface,
    @Body() createSubcategoryDto: CreateSubcategoryDto,
  ) {
    this.logger.log(`Creating subcategory for admin: ${user.id}`);

    // Only admins can create subcategories
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create subcategories');
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.createSubcategory(createSubcategoryDto),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error creating subcategory: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create subcategory');
    }
  }

  @Get('farms')
  @ApiOperation({ summary: 'Get farms with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Farms retrieved successfully' })
  @ResponseMessage('Farms retrieved successfully')
  async getFarms(@Query() farmFiltersDto: FarmFiltersDto) {
    this.logger.log(
      `Getting farms with filters: ${JSON.stringify(farmFiltersDto)}`,
    );

    try {
      const result = await firstValueFrom(
        this.productClientService.listFarms({
          search: farmFiltersDto.search,
          status: farmFiltersDto.status,
          city: farmFiltersDto.city,
          page: farmFiltersDto.page,
          limit: farmFiltersDto.limit,
          sort_by: farmFiltersDto.sort_by,
          order: farmFiltersDto.order,
          all: farmFiltersDto.all,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting farms: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve farms');
    }
  }

  @Get('farms/:id')
  @ApiOperation({ summary: 'Get farm by ID' })
  @ApiParam({ name: 'id', description: 'Farm ID' })
  @ApiResponse({ status: 200, description: 'Farm retrieved successfully' })
  @ResponseMessage('Farm retrieved successfully')
  async getFarm(
    @Param('id') id: string,
    @Query('include_products') includeProducts?: boolean,
  ) {
    this.logger.log(`Getting farm with ID: ${id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getFarm(id, includeProducts || false),
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting farm: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve farm');
    }
  }

  @Get('farms/my/farm')
  @ApiOperation({ summary: "Get current user's farm" })
  @ApiResponse({ status: 200, description: 'User farm retrieved successfully' })
  @ResponseMessage('User farm retrieved successfully')
  async getMyFarm(
    @User() user: UserInterface,
    @Query('include_products') includeProducts?: boolean,
  ) {
    this.logger.log(`Getting farm for user: ${user.id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.getFarmByUser(
          user.id,
          includeProducts || false,
        ),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting user farm: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve user farm');
    }
  }

  @Post('farms/register')
  @ApiOperation({ summary: 'Register new farm' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Farm registered successfully' })
  @ResponseMessage('Farm registered successfully')
  async registerFarm(
    @User() user: UserInterface,
    @Body() registerFarmDto: RegisterFarmDto,
    @UploadedFiles()
    files: {
      cccd?: Express.Multer.File[];
      biometric_video?: Express.Multer.File[];
    },
  ) {
    this.logger.log(`Registering farm for user: ${user.id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.createFarm({
          ...registerFarmDto,
          user_id: user.id,
          files,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error registering farm: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to register farm');
    }
  }

  @Put('farms/:id')
  @ApiOperation({ summary: 'Update farm by ID' })
  @ApiParam({ name: 'id', description: 'Farm ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Farm updated successfully' })
  @ResponseMessage('Farm updated successfully')
  async updateFarm(
    @User() user: UserInterface,
    @Param('id') id: string,
    @Body() updateFarmDto: UpdateFarmDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      profile_images?: Express.Multer.File[];
      certificate_images?: Express.Multer.File[];
    },
  ) {
    this.logger.log(`Updating farm ${id} for user: ${user.id}`);

    try {
      const result = await firstValueFrom(
        this.productClientService.updateFarm(id, {
          ...updateFarmDto,
          user_id: user.id,
          files,
        }),
      );
      return result;
    } catch (error) {
      this.logger.error(`Error updating farm: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update farm');
    }
  }

  @Put('admin/farms/:id/status')
  @ApiOperation({ summary: 'Update farm status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Farm ID' })
  @ApiResponse({ status: 200, description: 'Farm status updated successfully' })
  @ResponseMessage('Farm status updated successfully')
  async updateFarmStatus(
    @User() user: UserInterface,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFarmStatusDto,
  ) {
    this.logger.log(
      `Admin ${user.id} updating farm ${id} status to: ${updateStatusDto.status}`,
    );

    // Only admins can update farm status
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update farm status');
    }

    try {
      const result = await firstValueFrom(
        this.productClientService.updateFarmStatus(
          id,
          updateStatusDto.status,
          updateStatusDto.reason || '',
          user.id,
        ),
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating farm status: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update farm status');
    }
  }
}
