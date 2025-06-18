import { IsEnum } from "class-validator";
import { ProductStatus } from "src/common/enums/product/product-status.enum";

export class UpdateProductStatusDto {
    @IsEnum(ProductStatus)
    status: ProductStatus;
}