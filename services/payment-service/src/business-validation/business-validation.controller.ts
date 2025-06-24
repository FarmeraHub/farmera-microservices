import { Body, Controller, Post } from "@nestjs/common";
import { BusinessValidationService } from "./business-validation.service";
import { ItemDto } from "./dto/list-product.dto";
import { OrderDetail } from "./dto/validate-response.dto";



interface listItemDto {
    list: ItemDto[];
}

interface OrderRequest{
    products: ItemDto[];
    order_detail: OrderDetail;
}
@Controller('test')
export class BusinessValidationController {
    constructor(
        private readonly businessValidationService: BusinessValidationService,
    ) {
    }

    @Post('test')
    async test(
        @Body() body: OrderRequest, 
    ) {
        try {
            return await this.businessValidationService.validateOrder(body.products, body.order_detail);
        } catch (error) {
            console.error('Error in test:', error);
            throw error; // Re-throw the error for further handling
        }
    }
}