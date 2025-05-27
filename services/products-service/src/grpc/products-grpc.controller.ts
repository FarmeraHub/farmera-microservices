import { Controller } from "@nestjs/common";
import { ProductsService } from "src/products/products.service";

@Controller()
export class ProductsGrpcController {
    constructor(
        private readonly produtsService: ProductsService
    ) { }

}