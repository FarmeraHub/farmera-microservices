import { Body, Controller, Get, Logger, ParseArrayPipe, Post, Query } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller('order')
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);
    constructor(private readonly ordersService: OrdersService,
    ) {
    }

    @Get('test')
    async testGet(): Promise<string> {
        this.logger.log('TEST Endpoint: GET /order/test');
        return 'Hello from Order Service!';
    }
    

}