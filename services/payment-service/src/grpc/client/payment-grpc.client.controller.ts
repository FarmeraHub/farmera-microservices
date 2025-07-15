import { Body, Controller, Logger, Post } from "@nestjs/common";
import { ProductsGrpcClientService } from "./product.service";
import { IsArray, IsNumber, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ProductIdDto {
    @IsNumber()
    product_id: number;
}

export class ListProductsDtoGrpcRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductIdDto)
    products: ProductIdDto[];
}

@Controller()
export class PaymentGrpcClientController {
    private readonly logger = new Logger(PaymentGrpcClientController.name);
    constructor(
        private readonly productsGrpcClientService: ProductsGrpcClientService,
    ) { }

    @Post('list-products')
    async listProducts(
        @Body() body: ListProductsDtoGrpcRequest,
    ): Promise<any> {
        this.logger.log(`Calling gRPC ListProducts with product_ids: ${JSON.stringify(body.products)}`);
        return await this.productsGrpcClientService.getListProducts(
            body.products.map(product => product.product_id),
            {
                include_farm: true,
            }
        );
    }
}