import { Body, Controller, Post } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CalculateDeliveryRequestDto } from './dto/calculate-delivery.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import { ShippingDetail } from '../order/entities/shipping-detail.entity';
import { Issue } from '../order/entities/issue.entity';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
    constructor(private readonly deliveryService: DeliveryService) { }


    @Post('calculate-fee')
    @ApiOperation({ summary: 'Calculate shipping fee for delivery' })
    @ApiBody({ type: CalculateDeliveryRequestDto })
    @ApiResponse({ status: 201, description: 'Shipping fee calculated successfully.' })
    @ApiBadRequestResponse({ description: 'Invalid request data.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    async calculateShippingFee(
        @User() user: UserInterface,
        @Body() calculateDeliveryRequestDto: CalculateDeliveryRequestDto,
    ):Promise<ShippingDetail| Issue []> {
        // This method will handle the logic for calculating shipping fees
        // The actual implementation will depend on the business logic and requirements
        console.log(`calculateShippingFee called with userId: ${user.id}, suborders: ${JSON.stringify(calculateDeliveryRequestDto.suborder)}, address_id: ${calculateDeliveryRequestDto.order_info.address_id}`, 'DeliveryController');
        return await this.deliveryService.calculateShippingFee(user.id, calculateDeliveryRequestDto);
    }

}
