import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UnauthorizedException,
  Patch,
  Headers,
  Logger,
} from '@nestjs/common';

import { Role } from 'src/common/enums/role.enum';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class GetProductsByIdsRequestDto {
  @IsArray()
  @ArrayNotEmpty() // Đảm bảo mảng không rỗng
  @IsString({ each: true }) // Đảm bảo mỗi phần tử là string
  @IsNotEmpty({ each: true }) // Đảm bảo mỗi phần tử không rỗng
  product_ids: string[];
}

@Controller('product')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) { }

  @Post('create')
  async createProduct(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    if (!(role == Role.ADMIN || role == Role.FARMER)) {
      throw new UnauthorizedException('Không có quyền tạo sản phẩm');
    }
    return this.productsService.create(createProductDto, userId);
  }

  @Delete(':id')
  async deleteProduct(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Param('id') id: String,
  ) {
    // console.log('User ID từ header (req.headers):', userId);
    // console.log('Role từ header (req.headers):', role);
    if (!(role == Role.ADMIN || role == Role.FARMER)) {
      throw new UnauthorizedException('Không có quyền xoá sản phẩm');
    }
    return this.productsService.deleteProduct(Number(id), userId);
  }

  @Patch(':id')
  async updateProduct(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    if (!(role == Role.ADMIN || role == Role.FARMER)) {
      throw new UnauthorizedException('Không có quyền cập nhật sản phẩm');
    }
    return this.productsService.updateProduct(
      Number(id),
      updateProductDto,
      userId,
    );
  }

  @Get(':id')
  async getProductById(@Param('id') id: number) {
    return this.productsService.findProductById(id);
  }

  @Post(':id/generate-qr')
  async generateQRCode(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Param('id') id: string,
  ) {
    if (!(role == Role.ADMIN || role == Role.FARMER)) {
      throw new UnauthorizedException('Không có quyền tạo QR cho sản phẩm');
    }
    return this.productsService.generateQRCode(Number(id), userId);
  }

  // @Post(':id/activate-blockchain')
  // async activateBlockchain(
  //   @Headers('x-user-id') userId: string,
  //   @Headers('x-user-role') role: string,
  //   @Param('id') id: string,
  // ) {
  //   if (!(role == Role.ADMIN || role == Role.FARMER)) {
  //     throw new UnauthorizedException(
  //       'Không có quyền kích hoạt blockchain cho sản phẩm',
  //     );
  //   }
  //   return this.productsService.activateBlockchain(Number(id), userId);
  // }

  // @Get(':id/qr')
  // async getQRCode(@Param('id') id: string) {
  //   return this.productsService.getQRCode(Number(id));
  // }

  // @Get(':id/traceability')
  // async getTraceabilityData(@Param('id') id: string) {
  //   return this.productsService.getTraceabilityData(Number(id));
  // }

  // @Get(':id/verify-traceability')
  // async verifyTraceability(@Param('id') id: string) {
  //   return this.productsService.verifyProductTraceability(Number(id));
  // }

  // @Get()
  // async searchAndFilterProducts(
  //   @Query() paginationOptions: PaginationOptions,
  //   @Query('search') search?: string,
  //   @Query('category') category?: string,
  //   @Query('subcategory') subcategory?: string,
  //   @Query('minPrice') minPrice?: number,
  //   @Query('maxPrice') maxPrice?: number,
  //   @Query('farmId') farmId?: string,
  //   @Query('status') status?: ProductStatus,
  // ) {
  //   return this.productsService.searchAndFilterProducts(paginationOptions, {
  //     search,
  //     category,
  //     subcategory,
  //     minPrice,
  //     maxPrice,
  //     farmId,
  //     status,
  //   });
  // }
  // @Get()
  // async searchAndFillterProducts(
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  //   @Query('search') search?: string,
  //   @Query('category') category?: string,
  //   @Query('subcategory') subcategory?: string,
  //   @Query('minPrice') minPrice?: number,
  //   @Query('maxPrice') maxPrice?: number,
  //   @Query('farmId') farmId?: string,
  //   @Query('status') status?: ProductStatus,
  //   @Query('sortBy') sortBy?: string,
  //   @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  // ) {
  //   return this.productsService.searchAndFillterProducts(
  //     page,
  //     limit,
  //     search,
  //     category,
  //     subcategory,
  //     minPrice,
  //     maxPrice,
  //     farmId,
  //     status,
  //     sortBy,
  //     sortOrder
  //   );
  // }

  // @Post('by-ids')
  // async getMultipleProductsByIds(
  //   @Body() getProductsDto: GetProductsByIdsRequestDto,
  // ): Promise<ResponseProductDto[]> {
  //   this.logger.log(`[HTTP Test - GetMultipleProductsByIds] Received request for product IDs: ${JSON.stringify(getProductsDto.product_ids)}`);

  //   try {
  //     const products = await this.productsService.getProductsByIds(getProductsDto.product_ids);
  //     this.logger.log(`[HTTP Test - GetMultipleProductsByIds] Found ${products.length} products.`);
  //     return products;
  //   } catch (error) {
  //     this.logger.error(`[HTTP Test - GetMultipleProductsByIds] Error: ${error.message}`, error.stack);
  //     // NestJS sẽ tự động xử lý các exception chuẩn như BadRequestException, NotFoundException
  //     // Bạn có thể ném lại lỗi để NestJS xử lý hoặc custom response nếu cần
  //     throw error;
  //   }
  // }
}
