import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, Res } from '@nestjs/common';
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
import { Response } from 'express';

@Controller('product')
export class ProductController {

    constructor(private readonly productService: ProductService) { }

    @Post()
    async createProduct(@User() user: UserInterface, @Body() createProductDto: CreateProductDto) {
        return await this.productService.createProduct(user.id, createProductDto);
    }

    async getListProducts() { }

    @Put()
    async updateProduct(@User() user: UserInterface, @Body() updateProductDto: UpdateProductDto) {
        return await this.productService.updateProduct(user.id, updateProductDto);
    }

    @Patch("status/:product_id")
    async updateProductStatus(@User() user: UserInterface, @Param("product_id", ParseIntPipe) productId: number, @Body() status: UpdateProductStatusDto) {
        return await this.productService.updateProductStatus(user.id, productId, status.status);
    }

    @Post("open-for-sale/:product_id")
    async openProductForSale(@User() user: UserInterface, @Param("product_id", ParseIntPipe) productId: number) {
        return await this.productService.openProductForSale(user.id, productId);
    }

    @Delete(":product_id")
    async deleteProduct(@User() user: UserInterface, @Param("product_id", ParseIntPipe) productId: number) {
        return await this.productService.deleteProduct(productId, user.id);
    }

    @Public()
    @Get("search")
    async searchProducts(@Query() searchProductsDTo: SearchProductsDto) {
        return await this.productService.searchProducts(searchProductsDTo);
    }

    @Public()
    @Get("farm/:farm_id")
    async getProductsByFarm(@Param("farm_id") farmId: string, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsByFarm(farmId, getProductByFarmDto);
    }

    @Public()
    @Get("category/sub/:subcategory_id")
    async getProductsBySubCategory(@Param("subcategory_id", ParseIntPipe) subcategory_id: number, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsBySubCategory(subcategory_id, getProductByFarmDto);
    }

    @Public()
    @Get("category/:category_id")
    async getProductsByCategory(@Param("category_id", ParseIntPipe) categoryId: number, @Query() getProductByFarmDto?: GetProductByFarmDto) {
        return await this.productService.getProductsByCategory(categoryId, getProductByFarmDto);
    }

    @Public()
    @Get(":product_id")
    async getProduct(@Param("product_id", ParseIntPipe) productId: number, @Query() productOptions?: ProductOptions) {
        return await this.productService.getProductById(productId, productOptions);
    }
}
