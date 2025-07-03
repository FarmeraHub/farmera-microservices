import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Order } from "./../entities/order.entity";
import { DataSource, EntityManager, Repository } from "typeorm";
import { SubOrder } from "./../entities/sub-order.entity";
import { OrderDetail } from "./../entities/order-detail.entity";
import { PaymentService } from "src/payments/payment.service";
import { DeliveryService } from "src/delivery/delivery.service";
import { BusinessValidationService } from "src/business-validation/business-validation.service";
import { User } from "src/user/entities/user.entity";
import { Location } from "src/user/entities/location.entity";
import { OrderDetailService } from "../order-detail/order-detail.service";
import { OrderRequestDto } from "../dto/order.dto";
import { Issue, ShippingFeeDetails } from "src/delivery/enitites/cart.entity";
import { SubOrderService } from "../sub-order/sub-order.service";

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(SubOrder)
        private readonly subOrderRepository: Repository<SubOrder>,
        private readonly orderDetailService: OrderDetailService,
        private readonly subOrderService: SubOrderService,
        private readonly paymentService: PaymentService,
        private readonly deliveryService: DeliveryService,
        private readonly businessValidationService: BusinessValidationService,
        @InjectDataSource()
        private dataSource: DataSource,
        // private readonly entityManager: EntityManager,
    ) {
    }


    async createOrder(orderRequest: OrderRequestDto): Promise<Order | Issue[]> {
        let allIssues: Issue[] = [];
        let validSubOrders: ShippingFeeDetails[] = [];
        let validOrderInfo: { user: User; address: Location; } | null = null;

        const orderInfoValidationPromise = this.businessValidationService.validateOrderInfo(orderRequest.order_info);
        const subOrderValidationPromises = orderRequest.suborders.map(subOrder =>
            this.businessValidationService.validateSubOrder(subOrder)
        );

        const [orderInfoValidationResult, ...subOrdersValidationResults] = await Promise.all([
            orderInfoValidationPromise,
            ...subOrderValidationPromises
        ]);

        if (Array.isArray(orderInfoValidationResult)) {
            allIssues.push(...orderInfoValidationResult);
        } else {
            validOrderInfo = orderInfoValidationResult;
        }

        for (const subOrderResult of subOrdersValidationResults) {
            if (Array.isArray(subOrderResult)) {
                allIssues.push(...subOrderResult);
            } else {
                validSubOrders.push(subOrderResult);
            }
        }

        if (orderRequest.order_info.payment_method && orderRequest.order_info.payment_method !== 'COD') {
            allIssues.push({ reason: 'PAYMENT_UNSUPPORTED', details: 'Unsupported payment method', user_id:orderRequest.order_info.user_id });
        }

        if (allIssues.length > 0) {

            return allIssues;
        }

        const queryRunner = this.dataSource.createQueryRunner();

        // Kết nối queryRunner với database
        await queryRunner.connect();
        // Bắt đầu một transaction
        await queryRunner.startTransaction();
        this.logger.log(`Starting order creation transaction for user: ${validOrderInfo?.user.id}`);
        const transactionalManager = queryRunner.manager;

        try {
            //Tính tiền tổng,
            //Tính tiền ship
            //Xác định loại thanh toán
            //
            throw new Error('Not implemented yet');
        }
        catch (error) {
            this.logger.error(`Error during order creation transaction: ${error.message}`, error.stack);
            // Rollback transaction if any error occurs
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Always release the queryRunner
            await queryRunner.release();
        }
    }

}