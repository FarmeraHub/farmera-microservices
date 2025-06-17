import { Controller } from '@nestjs/common';

@Controller('product')
export class ProductController {

    //       getProduct(request: GetProductRequest): Observable<GetProductResponse> {
    //     this.logger.log(`Getting product with ID: ${request.product_id}`);
    //     return this.productsServiceGrpcClient.getProduct(request);
    //   }

    //   getListProducts(
    //     request: GetListProductsRequest,
    //   ): Observable<GetListProductsResponse> {
    //     this.logger.log(
    //       `Getting products with IDs: ${request.products.map((p) => p.product_id).join(', ')}`,
    //     );
    //     return this.productsServiceGrpcClient.getListProducts(request);
    //   }

    //   createProduct(
    //     request: CreateProductRequest,
    //   ): Observable<CreateProductResponse> {
    //     this.logger.log('Creating new product');
    //     return this.productsServiceGrpcClient.createProduct(request);
    //   }

    //   updateProduct(
    //     request: UpdateProductRequest,
    //   ): Observable<UpdateProductResponse> {
    //     this.logger.log(`Updating product with ID: ${request.product_id}`);
    //     return this.productsServiceGrpcClient.updateProduct(request);
    //   }

    //   deleteProduct(
    //     request: DeleteProductRequest,
    //   ): Observable<DeleteProductResponse> {
    //     this.logger.log(`Deleting product with ID: ${request.product_id}`);
    //     return this.productsServiceGrpcClient.deleteProduct(request);
    //   }

    //   searchProducts(
    //     request: SearchProductsRequest,
    //   ): Observable<SearchProductsResponse> {
    //     this.logger.log('Searching products with filters');
    //     return this.productsServiceGrpcClient.searchProducts(request);
    //   }


    /////////////////////////////////
    //     @Get()
    //   @ApiOperation({ summary: 'Search and filter products with pagination' })
    //   @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    //   @ResponseMessage('Products retrieved successfully')
    //   async searchProducts(@Query() searchDto: SearchProductsDto) {
    //     this.logger.log(
    //       `Searching products with filters: ${JSON.stringify(searchDto)}`,
    //     );

    //     try {
    //       return await this.productService.searchProducts(searchDto);
    //     } catch (error) {
    //       this.logger.error(
    //         `Error searching products: ${error.message}`,
    //         error.stack,
    //       );
    //       throw new BadRequestException('Failed to search products');
    //     }
    //   }

    //   @Get(':id')
    //   @ApiOperation({ summary: 'Get product by ID' })
    //   @ApiParam({ name: 'id', description: 'Product ID' })
    //   @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
    //   @ResponseMessage('Product retrieved successfully')
    //   async getProduct(@Param('id', ParseIntPipe) id: number) {
    //     this.logger.log(`Getting product with ID: ${id}`);

    //     try {
    //       return await this.productService.getProductById(id);
    //     } catch (error) {
    //       this.logger.error(`Error getting product: ${error.message}`, error.stack);
    //       throw new BadRequestException('Failed to retrieve product');
    //     }
    //   }

    //   @Post()
    //   @ApiOperation({ summary: 'Create new product' })
    //   @ApiConsumes('multipart/form-data')
    //   @ApiResponse({ status: 201, description: 'Product created successfully' })
    //   @ResponseMessage('Product created successfully')
    //   @UseInterceptors(
    //     FileFieldsInterceptor([
    //       { name: 'product_images', maxCount: 5 },
    //       { name: 'product_videos', maxCount: 2 },
    //     ]),
    //   )
    //   async createProduct(
    //     @User() user: UserInterface,
    //     @Body() createProductDto: CreateProductDto,
    //     @UploadedFiles()
    //     files: {
    //       product_images?: Express.Multer.File[];
    //       product_videos?: Express.Multer.File[];
    //     },
    //   ) {
    //     this.logger.log(`Creating product for user: ${user.id}`);

    //     // Only farmers and admins can create products
    //     if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
    //       throw new ForbiddenException(
    //         'Only farmers and admins can create products',
    //       );
    //     }

    //     try {
    //       return await this.productService.createProduct(
    //         createProductDto,
    //         user.id,
    //         files,
    //       );
    //     } catch (error) {
    //       this.logger.error(
    //         `Error creating product: ${error.message}`,
    //         error.stack,
    //       );
    //       throw new BadRequestException('Failed to create product');
    //     }
    //   }

    //   @Put(':id')
    //   @ApiOperation({ summary: 'Update product by ID' })
    //   @ApiParam({ name: 'id', description: 'Product ID' })
    //   @ApiConsumes('multipart/form-data')
    //   @ApiResponse({ status: 200, description: 'Product updated successfully' })
    //   @ResponseMessage('Product updated successfully')
    //   @UseInterceptors(
    //     FileFieldsInterceptor([
    //       { name: 'product_images', maxCount: 5 },
    //       { name: 'product_videos', maxCount: 2 },
    //     ]),
    //   )
    //   async updateProduct(
    //     @User() user: UserInterface,
    //     @Param('id', ParseIntPipe) id: number,
    //     @Body() updateProductDto: UpdateProductDto,
    //     @UploadedFiles()
    //     files: {
    //       product_images?: Express.Multer.File[];
    //       product_videos?: Express.Multer.File[];
    //     },
    //   ) {
    //     this.logger.log(`Updating product ${id} for user: ${user.id}`);

    //     // Only farmers and admins can update products
    //     if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
    //       throw new ForbiddenException(
    //         'Only farmers and admins can update products',
    //       );
    //     }

    //     try {
    //       return await this.productService.updateProduct(
    //         id,
    //         updateProductDto,
    //         user.id,
    //         files,
    //       );
    //     } catch (error) {
    //       this.logger.error(
    //         `Error updating product: ${error.message}`,
    //         error.stack,
    //       );
    //       throw new BadRequestException('Failed to update product');
    //     }
    //   }

    //   @Delete(':id')
    //   @ApiOperation({ summary: 'Delete product by ID' })
    //   @ApiParam({ name: 'id', description: 'Product ID' })
    //   @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    //   @ResponseMessage('Product deleted successfully')
    //   async deleteProduct(
    //     @User() user: UserInterface,
    //     @Param('id', ParseIntPipe) id: number,
    //   ) {
    //     this.logger.log(`Deleting product ${id} for user: ${user.id}`);

    //     // Only farmers and admins can delete products
    //     if (user.role !== UserRole.FARMER && user.role !== UserRole.ADMIN) {
    //       throw new ForbiddenException(
    //         'Only farmers and admins can delete products',
    //       );
    //     }

    //     try {
    //       return await this.productService.deleteProduct(id, user.id);
    //     } catch (error) {
    //       this.logger.error(
    //         `Error deleting product: ${error.message}`,
    //         error.stack,
    //       );
    //       throw new BadRequestException('Failed to delete product');
    //     }
    //   }

    //   @Post('bulk')
    //   @ApiOperation({ summary: 'Get multiple products by IDs' })
    //   @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
    //   @ResponseMessage('Products retrieved successfully')
    //   async getProductsByIds(@Body() productIdsDto: ProductIdsDto) {
    //     this.logger.log(
    //       `Getting products by IDs: ${productIdsDto.product_ids.join(', ')}`,
    //     );

    //     try {
    //       return await this.productService.getProductsByIds(
    //         productIdsDto.product_ids,
    //       );
    //     } catch (error) {
    //       this.logger.error(
    //         `Error getting products by IDs: ${error.message}`,
    //         error.stack,
    //       );
    //       throw new BadRequestException('Failed to retrieve products');
    //     }
    //   }

}
