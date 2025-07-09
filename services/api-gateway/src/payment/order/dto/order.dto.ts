import { ApiProperty } from "@nestjs/swagger";
import { OrderInfoRequestDto, SubOrderRequestDto } from "src/payment/delivery/dto/calculate-delivery.dto";
import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class OrderRequestDto {

    @ApiProperty({
        description: 'List of suborders with items to be delivered',
        type: [SubOrderRequestDto],
    })
    @IsNotEmpty({ message: 'Suborders cannot be empty.' })
    @ValidateNested({ each: true })
    @Type(() => SubOrderRequestDto)
    @IsNotEmpty()
    @IsArray({ message: 'Suborders must be an array.' })
    suborders: SubOrderRequestDto[];

    @ApiProperty({
        description: 'Order information including user ID and address ID',
        type: OrderInfoRequestDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => OrderInfoRequestDto)
    order_info: OrderInfoRequestDto;
}