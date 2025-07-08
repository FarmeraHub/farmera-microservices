import { IsEnum } from "class-validator";
import { ProductStatus } from "src/common/enums/product/product-status.enum";

export class UpdateProductStatusForAdminDto {
    @IsEnum(ProductStatus)
    status: ProductStatus
}