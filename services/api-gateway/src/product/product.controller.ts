import { Body, Controller, Get, Logger, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { User } from "src/common/decorators/user.decorator";
import { User as UserInterface } from '../common/interfaces/user.interface'
import { ProductClientService } from "./product.client.service";
import { Public } from "src/common/decorators/public.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProductService } from "./product.service";

@Controller('product')
export class ProductController {
    private readonly logger = new Logger(ProductController.name);
    constructor(
        private readonly productClient: ProductClientService,
        private readonly productService: ProductService
    ) {

    }


    @Post('create')
    async createFarm(
        @User() user: UserInterface,
    ) {
        return { message: 'Farm created successfully' };
    }
    @Public()
    @Get('get-product/:productId')
    async getProduct(
        @Param('productId') productId: string,
    ) {


        const requestPayload = {
            product_id: Number(productId),
        };
        try {
            const product = await this.productClient.GetProduct(requestPayload);
            return product;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    }

    @Public()
    @Get('categories/getall')
    async getAllCategories() {
        try {
            const categories = await this.productClient.GetAllCategoryWithSubcategory();
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    @Public()
    @Post('categories/create')
    @UseInterceptors(FileInterceptor('category_icon'))
    async createCategory(
        @Body() categoryDto: any,
        @UploadedFile() file?: Express.Multer.File,
    ) {

        this.logger.log('📂 Uploaded file info:', {
            originalname: file?.originalname,
            mimetype: file?.mimetype,
            size: file?.size,
            encoding: file?.encoding,
            fieldname: file?.fieldname,
        });


        return this.productService.createCategory(categoryDto, file);
    }

    @Public()
    @Get('categories/get/:categoryId')
    async getCategory(
        @Param('categoryId') categoryId: string,
    ) {
        const requestPayload = {
            category_id: Number(categoryId),
            include_subcategories: true,
            include_product_count: true,
        };
        return this.productClient.GetCategory(requestPayload);
    }

    @Public()
    @Get('subcategories/get/:subcategoryId')
    async getSubcategory(
        @Param('subcategoryId') subcategoryId: string,
    ) {
        const requestPayload = {
            subcategory_id: Number(subcategoryId),
        };
        return this.productClient.GetSubcategory(requestPayload);
    }
    @Public()
    @Post('subcategories/create')
    async createSubcategory(
        @Body() subcategoryDto: any,
    ) {
        this.logger.log('Creating subcategory with data:', subcategoryDto);
        return this.productClient.CreateSubcategory(subcategoryDto);
    }
}