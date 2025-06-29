import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { EntityManager, Repository } from "typeorm";
import { SubOrder } from "./entities/sub-order.entity";
import { OrderDetail } from "./entities/order-detail.entity";
import { PaymentService } from "src/payments/payment.service";
import { DeliveryService } from "src/delivery/delivery.service";
import { BusinessValidationService } from "src/business-validation/business-validation.service";
import { User } from "src/user/entities/user.entity";
import { Location } from "src/user/entities/location.entity";

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
        private readonly businessValidationService: BusinessValidationService,
        // private readonly entityManager: EntityManager,
    ) {
    }

    // async createOrder(createOrderDto: CreateOrderDto, user: User, location: Location): Promise<Order> {
    //     return this.entityManager.transaction(async manager => {
    //         const newOrder = manager.create(Order, {
    //             user_id: user.id,
    //             total_amount: createOrderDto.total_amount,
    //             status: 'PENDING',
    //             payment_method_id: createOrderDto.payment_method_id,
    //         });
    //         const savedOrder = await manager.save(newOrder);

    //         for (const subOrderDto of createOrderDto.sub_orders) {
    //             const newSubOrder = manager.create(SubOrder, {
    //                 order: savedOrder,
    //                 farm_id: subOrderDto.farm_id,
    //                 total_amount: subOrderDto.total_amount,
    //                 shipping_fee: subOrderDto.shipping_fee,
    //                 status: 'PENDING',
    //             });
    //             const savedSubOrder = await manager.save(newSubOrder);

    //             for (const item of subOrderDto.items) {
    //                 const newOrderDetail = manager.create(OrderDetail, {
    //                     sub_order: savedSubOrder,
    //                     product_id: item.product_id,
    //                     quantity: item.quantity,
    //                     price: item.price,
    //                 });
    //                 await manager.save(newOrderDetail);
    //             }

    //             await this.deliveryService.createPendingDeliveryWithManager({
    //                 shipping_fee_from_sub_order_dto: subOrderDto.shipping_fee,
    //                 farm_id: subOrderDto.farm_id,
    //                 receiver_name: location.receiver_name,
    //                 receiver_phone: location.phone_number,
    //                 to_address: location.address_detail,
    //                 to_ward_name: location.ward,
    //                 to_district_name: location.district,
    //                 to_city_name: location.city,
    //             }, savedSubOrder, manager);
    //         }

    //         return savedOrder;
    //     });
    // }

    

}