import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
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
import { OrderStatus } from "src/common/enums/payment/order-status.enum";
import { Order } from "../entities/order.entity";
import { SubOrderDto } from "../dto/sub-order.dto";
import { SubOrderStatus } from "src/common/enums/payment/sub-order-status.enum";
import { CreateGhnOrderDto, GhnPaymentTypeId, GhnRequiredNote } from "src/delivery/dto/ghnn-create-delivery.dto";
import { GhnFeeData } from "src/delivery/dto/ghn-fee-response.dto";
import { GhnCreatedOrderDataDto } from "src/delivery/dto/ghn-order-response.dto";
import { PaymentMethod, PaymentStatus } from "src/common/enums/payment/payment.enum";

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
            allIssues.push({ reason: 'PAYMENT_UNSUPPORTED', details: 'Unsupported payment method', user_id: orderRequest.order_info.user_id });
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

            //Giá tổng tất cả các sản phẩm trong các suborder
            const totalAmount = validSubOrders.reduce((sum, subOrder) => {
                return sum + subOrder.products.reduce((productSum, product) => {
                    return productSum + (product.price_per_unit * product.requested_quantity);
                }, 0);
            }, 0);
            //Tạo dto cho từng suborder để chuẩn bị tạo order theo GHN
            const createGHN: CreateGhnOrderDto[] = validSubOrders.map(subOrder => {
                return {
                    from_name: subOrder.farm_name,
                    from_phone: subOrder.phone,
                    from_address: subOrder.street_number + ' ' + subOrder.street + ', ' + subOrder.ward + ', ' + subOrder.district + ', ' + subOrder.city,
                    from_district_name: subOrder.district,
                    from_province_name: subOrder.city,
                    from_ward_name: subOrder.ward, to_name: validOrderInfo!.address.name,
                    to_phone: validOrderInfo!.address.phone,
                    to_address: validOrderInfo!.address.address_line,
                    to_ward_name: validOrderInfo!.address.ward,
                    to_district_name: validOrderInfo!.address.district,
                    to_province_name: validOrderInfo!.address.city,
                    return_phone: subOrder.phone,
                    return_address: subOrder.street_number + ' ' + subOrder.street + ', ' + subOrder.ward + ', ' + subOrder.district + ', ' + subOrder.city,
                    // nếu là cod thì phải thêm cdo
                    cod_amount: subOrder.products.reduce((codSum, product) => {
                        return codSum + (product.price_per_unit * product.quantity);
                    }, 0),
                    weight: 0,// trong hàm tạo order sẽ tính lại weight
                    payment_type_id: GhnPaymentTypeId.NGUOI_NHAN_THANH_TOAN,
                    required_note: GhnRequiredNote.CHO_XEM_HANG_KHONG_THU,
                    items: subOrder.products.map(product => ({
                        name: product.product_name,
                        quantity: product.quantity,
                        weight: product.weight,
                        length: 0,
                        height: 0,
                        width: 0,
                        price: product.price_per_unit,
                    })),
                };
            });
            // Tạo đơn hàng GHN
            const resultGHNPromises = createGHN.map(ghnOrder => {
                return this.deliveryService.createOrderByGHN(ghnOrder);
            });
            const resultGHN: GhnCreatedOrderDataDto[] = await Promise.all(resultGHNPromises);



            const shippingAmount = resultGHN.reduce((sum, item) => sum + item.fee.main_service, 0)
            const discount = 0;
            const createOrder = transactionalManager.create(Order, {
                customer_id: validOrderInfo!.user.id,
                address_id: validOrderInfo!.address.location_id.toString(),
                total_amount: totalAmount,
                shipping_amount: shippingAmount, // Tổng tiền ship từ GHN
                final_amount: totalAmount + shippingAmount - discount, // Tổng tiền = tổng sản phẩm + tiền ship - discount
                currency: 'VND',
                status: OrderStatus.PENDING,
                discount_amount: discount,
            });

            const savedOrder = await transactionalManager.save(createOrder);
            // const createSuborders = subOrderDto.map(async subOrder => {
            //     await this.subOrderService.create(subOrder, createOrder, transactionalManager);
            // });
            // await Promise.all(createSuborders);

            // lưu mỗi suborder vào db
            for (let i = 0; i < validSubOrders.length; i++) {
                const subOrderData = validSubOrders[i];
                const ghnOrderResult = resultGHN[i];

                this.logger.log(`Processing suborder ${i + 1}/${validSubOrders.length} for farm: ${subOrderData.farm_name}`);

                // 1. Tạo SubOrder
                const createSubOrder = await this.subOrderService.create(
                    {
                        farm_id: subOrderData.farm_id,
                        status: SubOrderStatus.PENDING,
                        total_amount: subOrderData.total,
                        discount_amount: 0, // Giả sử không có discount
                        shipping_amount: subOrderData.shipping_fee,
                        final_amount: subOrderData.total + subOrderData.shipping_fee, // Tổng tiền = tổng sản phẩm + tiền ship
                        currency: 'VND',
                        avartar_url: subOrderData.avatar_url,
                        notes: '', // Có thể thêm ghi chú nếu cần
                    },
                    savedOrder,
                    transactionalManager);


                for (const product of subOrderData.products) {
                    const orderDetail = await this.orderDetailService.create(
                        product, // Sử dụng Item (Item là sản phẩm đã được validate)
                        createSubOrder,
                        transactionalManager
                    );
                }
                const delivery = await this.deliveryService.create(
                    ghnOrderResult,
                    createSubOrder,
                    createSubOrder.total_amount,
                    transactionalManager
                );

            }

            const payment = await this.paymentService.create(
                {
                    amount: savedOrder.final_amount,
                    method: PaymentMethod.COD, // Giả sử thanh toán COD
                    status: PaymentStatus.PENDING,
                    currency: savedOrder.currency,
                    transaction_id: '',
                    paid_at: null,
                },
                savedOrder,
                transactionalManager
            )


            await queryRunner.commitTransaction();
            return savedOrder;
        }
        catch (error) {
            this.logger.error(`Error during order creation transaction: ${error.message}`, error.stack);
            // Rollback transaction if any error occurs
            // chưa có logic huỷ đơn hàng của gian hàng nhanh.
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Always release the queryRunner
            await queryRunner.release();
        }
    }

}