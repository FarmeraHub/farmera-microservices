import { Body, Controller, Post } from "@nestjs/common";
import { DeliveryService } from "./delivery.service";
import { GhnFeeData } from "./dto/ghn-fee-response.dto";
import { CalculateShippingFeeDto } from "./dto/calculate-shipping-fee.dto";
import { CreateGhnOrderDto } from "./dto/ghnn-create-delivery.dto";
import { GhnCreatedOrderDataDto } from "./dto/ghn-order-response.dto";

@Controller('delivery')
export class DeliveryController {
    constructor(
        private readonly deliveryService: DeliveryService, // Assuming you have a DeliveryService
    ) {
        // Initialize any dependencies or services here if needed
    }
    @Post('calculate-fee')
    async calculateFee(@Body() calculateDto: CalculateShippingFeeDto): Promise<GhnFeeData> {
        return this.deliveryService.calculateFeeByGHN(calculateDto);
    }
    @Post('create-order')
    async createOrder(@Body() calculateDto: CreateGhnOrderDto): Promise<GhnCreatedOrderDataDto> {
        return this.deliveryService.createOrderByGHN(calculateDto);
    }
}