import { IsEnum } from "class-validator";
import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductStatusDto {
    @ApiProperty({ description: 'Product status', enum: ProductStatus, example: ProductStatus.PRE_ORDER })
    @IsEnum(ProductStatus)
    status: ProductStatus;
}