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
    
}