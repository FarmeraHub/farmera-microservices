import { Injectable, Logger } from "@nestjs/common";
import { ProductClientService } from "./product.client.service";

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);
    constructor(
        private readonly productClient: ProductClientService,
    ) { }

    async createProduct(productData: any): Promise<any> {
       
        return { message: 'Product created successfully', data: productData };
    }

    async createCategory(categoryData: any, file?: Express.Multer.File): Promise<any> {
        const requestPayload = {
            name: categoryData.category_name, 
            description: categoryData.category_description ?? null,
            category_icon_data: file?.buffer ?? null,
            icon_filename: file?.originalname ?? null,
            icon_mime_type: file?.mimetype ?? null,
        };

        this.logger.log('🧾 GRPC Payload for CreateCategoryRequest:', {
            ...requestPayload,
            category_icon_data: requestPayload.category_icon_data
                ? `[${requestPayload.category_icon_data.length} bytes]`
                : null,
        });

        const result = await this.productClient.CreateCategory(requestPayload);

        return {
            message: 'Category created successfully',
            data: result, 
        };

    }
}