import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductOptions } from './dto/product-options.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GetProductByFarmDto } from './dto/get-by-farm.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { UpdateProductStatusDto } from './dto/update-product-status';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Product } from './entities/product.entity';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a product',
    description: 'Creates a new product for the authenticated user.',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or creation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createProduct(
    @User() user: UserInterface,
    @Body() createProductDto: CreateProductDto,
  ) {
    return await this.productService.createProduct(user.id, createProductDto);
  }

  async getListProducts() {}

  @Put(':product_id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product to update',
    type: Number,
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateProduct(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(
      user.id,
      productId,
      updateProductDto,
    );
  }

  @Patch('status/:product_id')
  @ApiOperation({
    summary: 'Update product status',
    description: 'Updates the status of a product.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product to update',
    type: Number,
  })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Product status updated successfully',
    type: Boolean,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateProductStatus(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
    @Body() status: UpdateProductStatusDto,
  ) {
    return await this.productService.updateProductStatus(
      user.id,
      productId,
      status.status,
    );
  }

  @Post('open-for-sale/:product_id')
  @ApiOperation({
    summary: 'Open product for sale',
    description: 'Marks a product as open for sale.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product to open for sale',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Product opened for sale successfully',
    type: String,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async openProductForSale(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    return await this.productService.openProductForSale(user.id, productId);
  }

  @Delete(':product_id')
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Deletes a product.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product to delete',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: Boolean,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async deleteProduct(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    return await this.productService.deleteProduct(productId, user.id);
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Search products',
    description: 'Searches for products with filters and pagination.',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'min_price', required: false, type: Number })
  @ApiQuery({ name: 'max_price', required: false, type: Number })
  @ApiQuery({ name: 'min_rating', required: false, type: Number })
  @ApiQuery({ name: 'max_rating', required: false, type: Number })
  @ApiQuery({ name: 'min_total_sold', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN_FOR_SALE', 'PRE_ORDER', 'OUT_OF_STOCK', 'DISCONTINUED'],
  })
  @ApiQuery({ name: 'subcategory_id', required: false, type: Number })
  @ApiQuery({ name: 'is_category', required: false, type: Boolean })
  @ApiQuery({ name: 'include_farm', required: false, type: Boolean })
  @ApiQuery({ name: 'include_categories', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated search result',
    type: [Product],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async searchProducts(@Query() searchProductsDTo: SearchProductsDto) {
    return await this.productService.searchProducts(searchProductsDTo);
  }

  @Public()
  @Get('farm/:farm_id')
  @ApiOperation({
    summary: 'Get products by farm',
    description: 'Retrieves products for a specific farm.',
  })
  @ApiParam({ name: 'farm_id', description: 'ID of the farm', type: String })
  @ApiQuery({ name: 'include_categories', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products',
    type: [Product],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getProductsByFarm(
    @Param('farm_id') farmId: string,
    @Query() getProductByFarmDto?: GetProductByFarmDto,
  ) {
    return await this.productService.getProductsByFarm(
      farmId,
      getProductByFarmDto,
    );
  }

  @Public()
  @Get('category/sub/:subcategory_id')
  @ApiOperation({
    summary: 'Get products by subcategory',
    description: 'Retrieves products for a specific subcategory.',
  })
  @ApiParam({
    name: 'subcategory_id',
    description: 'ID of the subcategory',
    type: Number,
  })
  @ApiQuery({ name: 'include_categories', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products',
    type: [Product],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getProductsBySubCategory(
    @Param('subcategory_id', ParseIntPipe) subcategory_id: number,
    @Query() getProductByFarmDto?: GetProductByFarmDto,
  ) {
    return await this.productService.getProductsBySubCategory(
      subcategory_id,
      getProductByFarmDto,
    );
  }

  @Public()
  @Get('category/:category_id')
  @ApiOperation({
    summary: 'Get products by category',
    description: 'Retrieves products for a specific category.',
  })
  @ApiParam({
    name: 'category_id',
    description: 'ID of the category',
    type: Number,
  })
  @ApiQuery({ name: 'include_categories', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products',
    type: [Product],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getProductsByCategory(
    @Param('category_id', ParseIntPipe) categoryId: number,
    @Query() getProductByFarmDto?: GetProductByFarmDto,
  ) {
    return await this.productService.getProductsByCategory(
      categoryId,
      getProductByFarmDto,
    );
  }

  @Post(':product_id/generate-qr')
  @ApiOperation({
    summary: 'Generate QR code for product',
    description: 'Generates a QR code for product traceability.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    schema: { properties: { qr_code: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async generateQRCode(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    return await this.productService.generateQRCode(productId, user.id);
  }

  @Post(':product_id/activate-blockchain')
  @ApiOperation({
    summary: 'Activate blockchain for product',
    description: 'Activates blockchain traceability for the product.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Blockchain activated successfully',
    schema: {
      properties: {
        blockchain_hash: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiBadRequestResponse({
    description: 'Product already activated or invalid',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async activateBlockchain(
    @User() user: UserInterface,
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    return await this.productService.activateBlockchain(productId, user.id);
  }

  @Public()
  @Get(':product_id/qr')
  @ApiOperation({
    summary: 'Get QR code for product',
    description: 'Retrieves the QR code for a product.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
    schema: { properties: { qr_code: { type: 'string', nullable: true } } },
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getQRCode(@Param('product_id', ParseIntPipe) productId: number) {
    return await this.productService.getQRCode(productId);
  }

  @Public()
  @Get(':product_id/traceability')
  @ApiOperation({
    summary: 'Get traceability data for product',
    description:
      'Retrieves comprehensive traceability data including process assignments and step diaries.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Traceability data retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getTraceabilityData(
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    const traceabilityData =
      await this.productService.getTraceabilityData(productId);
    return {
      data: traceabilityData,
      message: 'Traceability data retrieved successfully',
    };
  }

  @Public()
  @Get(':product_id/verify-traceability')
  @ApiOperation({
    summary: 'Verify product traceability',
    description:
      'Verifies the integrity of product traceability data against blockchain records.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Traceability verification completed',
    schema: {
      properties: {
        isValid: { type: 'boolean' },
        error: { type: 'string', nullable: true },
        verificationDate: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async verifyTraceability(
    @Param('product_id', ParseIntPipe) productId: number,
  ) {
    return await this.productService.verifyTraceability(productId);
  }

  @Public()
  @Get(':product_id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a product by its ID.',
  })
  @ApiParam({
    name: 'product_id',
    description: 'ID of the product',
    type: Number,
  })
  @ApiQuery({ name: 'include_farm', required: false, type: Boolean })
  @ApiQuery({ name: 'include_processes', required: false, type: Boolean })
  @ApiQuery({ name: 'include_categories', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: Product,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getProduct(
    @Param('product_id', ParseIntPipe) productId: number,
    @Query() productOptions?: ProductOptions,
  ) {
    return await this.productService.getProductById(productId, productOptions);
  }
}
