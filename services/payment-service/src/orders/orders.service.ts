import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { SubOrder } from "./entities/sub-order.entity";
import { OrderDetail } from "./entities/order-detail.entity";
import { PaymentService } from "src/payments/payment.service";
import { DeliveryService } from "src/delivery/delivery.service";

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(SubOrder)
        private readonly subOrderRepository: Repository<SubOrder>,
        @InjectRepository(OrderDetail)
        private readonly orderDetailRepository: Repository<OrderDetail>,
        private readonly paymentService: PaymentService,
        private readonly deliveryService: DeliveryService,
    ) {
    }

    

}