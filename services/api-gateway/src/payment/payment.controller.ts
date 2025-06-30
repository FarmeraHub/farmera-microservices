import { Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiBadGatewayResponse, ApiBearerAuth, ApiBody, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { CalculateShippingFeeDto } from "./order/dto/calculate-shipping-fee-multi-item.dto";
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { PaymentClientService } from "./payment.client.service";

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {

    constructor(
        private readonly paymentClientService: PaymentClientService,
    ) {}
    @Post('calculate-fee')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Caculate fee for order' })
    @ApiResponse({ status: 201, description: 'Successfully caculate fee.', type: CalculateShippingFeeDto })
    @ApiBadGatewayResponse({ description: 'Failed to caculate fee.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    @ApiBody({ type: CalculateShippingFeeDto })
    @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    async calculateShippingFee(
        @User() user: UserInterface,
        @Body() calculateShippingFeeDto: CalculateShippingFeeDto,
    ): Promise<any> {
        
        const test = await this.paymentClientService.calculateShippingFee(calculateShippingFeeDto, user.id);
        return test;

    }
}