import { Body, Controller, Post } from "@nestjs/common";
import { OrderService } from "./order.service";
import { ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { OrderRequestDto } from "./dto/order.dto";
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import { Order } from "./entities/order.entity";
import { Payment } from "../payment/entities/payment.entity";
import { SubOrder } from "./entities/sub-order.entity";
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
    ):Promise<{order: Order, payment?: Payment, suborders?: SubOrder[] } | Issue[]> {
        console.log(`createOrder called with userId: ${user.id}, orderRequestDto: ${JSON.stringify(orderRequestDto)}`, 'OrderController');
        return await this.orderService.createOrder(user.id, orderRequestDto);
    }
}