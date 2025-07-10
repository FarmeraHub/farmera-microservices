import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { OrderService } from "./order.service";
import { ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { OrderRequestDto } from "./dto/order.dto";
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import { Order } from "./entities/order.entity";
import { Payment } from "../payment/entities/payment.entity";
import { SubOrder, SubOrderWithDetail } from "./entities/sub-order.entity";
import { Issue } from "./entities/issue.entity";

@Controller('order')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
    ) { }
    @Post('create-order')
    @ApiOperation({ summary: 'Create a new order' })
    @ApiBody({ type: OrderRequestDto })
    @ApiResponse({ status: 201, description: 'Order created successfully.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    async createOrder(
        @User() user: UserInterface,
        @Body() orderRequestDto: OrderRequestDto,
    ): Promise<{ order: Order, payment?: Payment, suborderwithDetail?: SubOrderWithDetail[] } | Issue[]> {

        try {
            console.log(`createOrder called with userId: ${user.id}, orderRequestDto: ${JSON.stringify(orderRequestDto)}`, 'OrderController');
            const result = await this.orderService.createOrder(user.id, orderRequestDto);
            if (Array.isArray(result)) {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                        message: 'One or more errors occurred while creating the order.',
                        errors: result,
                    },
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
            return result;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected error occurred while creating the order.',
                    error: error.message || 'Internal Server Error',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );

        }
    }
}