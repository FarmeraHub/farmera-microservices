import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
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
    ): Promise<ShippingDetail | Issue[]> {
        try {
            const result = await this.deliveryService.calculateShippingFee(user.id, calculateDeliveryRequestDto);

            // Nếu là lỗi dạng Issue[]
            if (Array.isArray(result)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                        message: 'One or more errors occurred while calculating shipping fee.',
                        errors: result,
                    },
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }

            // Nếu thành công → trả về 201
            return result;
        } catch (error) {
            // Có thể là lỗi từ GHN hoặc logic khác
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected error occurred while calculating shipping fee.',
                    error: error.message || 'Internal Server Error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        }
    }
}
