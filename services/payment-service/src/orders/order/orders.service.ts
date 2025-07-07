import { PayOSService } from './../../payos/payos.service';
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
import { ProductsGrpcClientService } from 'src/grpc/client/product.service';
import { UpdateProductQuantityOperation } from 'src/common/enums/product/update-product-quantity-operation.enum';

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
        private readonly PayOSService: PayOSService,
        private readonly productsGrpcClientService: ProductsGrpcClientService,
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

        const paymentType = orderRequest.order_info.payment_type;
        this.logger.debug(`Extracted payment type: "${paymentType}"`);
        this.logger.debug(`Is COD: ${paymentType === 'COD'}`);
        this.logger.debug(`Is PAYOS: ${paymentType === 'PAYOS'}`);
        if (paymentType && paymentType !== 'COD' && paymentType !== 'PAYOS') {
            allIssues.push({ reason: 'PAYMENT_UNSUPPORTED', details: 'Unsupported payment method', user_id: orderRequest.order_info.user_id });
        }

        this.logger.debug(`method payment: ${orderRequest.order_info.payment_type}`);
        if (allIssues.length > 0) {

            return allIssues;
        }

        if (paymentType === 'COD') {
            this.logger.log(`Routing to COD payment for user: ${validOrderInfo?.user.id}`);
            return await this.createOrderWithTransactionForCOD(validSubOrders, validOrderInfo!, orderRequest);
        }
        else if (paymentType === 'PAYOS') {
            this.logger.log(`Routing to PAYOS payment for user: ${validOrderInfo?.user.id}`);
            return await this.createOrderWithTransactionForPayOS(validSubOrders, validOrderInfo!, orderRequest);
        }
        throw new Error('Unsupported payment method');


    }

    async createOrderWithTransactionForCOD(validSubOrders: ShippingFeeDetails[], validOrderInfo: { user: User; address: Location; }, orderRequest: OrderRequestDto): Promise<Order | Issue[]> {
        //Trừ số lượng sản phẩm
        try {
            await this.updateProductQuantities(validSubOrders, UpdateProductQuantityOperation.DECREASE);
            this.logger.log(`Successfully decreased product quantities before transaction`);
        } catch (error) {
            this.logger.error(`Failed to decrease product quantities: ${error.message}`);
            return [{
                reason: 'INSUFFICIENT_STOCK',
                details: `Không đủ số lượng sản phẩm: ${error.message}`,
                user_id: validOrderInfo.user.id,
            }];
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        // Bắt đầu một transaction
        await queryRunner.startTransaction();
        this.logger.log(`Starting order creation transaction for user: ${validOrderInfo?.user.id}`);
        const transactionalManager = queryRunner.manager;

        this.logger.debug(`Valid suborders: ${JSON.stringify(validSubOrders, null, 2)}`);

        try {
            const totalAmount = validSubOrders.reduce((sum, subOrder) => {
                return sum + subOrder.products.reduce((productSum, product) => {
                    return productSum + (product.price_per_unit * product.requested_quantity);
                }, 0);
            }, 0);


            const resultGHN: GhnCreatedOrderDataDto[] = await this.createOrderGHN(validSubOrders, validOrderInfo);

            //Tính tiền ship của tất cả các suborder (dựa tren kết quả từ GHN)
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
            let subOrderTemp: SubOrder[] = []
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
                subOrderTemp.push(createSubOrder);

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

            const savePayment = await this.paymentService.create(
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
            const order = await this.orderRepository.createQueryBuilder('order')
                .leftJoinAndSelect('order.payment', 'payment')
                .leftJoinAndSelect('order.sub_orders', 'sub_order')
                .leftJoinAndSelect('sub_order.delivery', 'delivery')
                .leftJoinAndSelect('sub_order.order_details', 'order_detail')
                .where('order.order_id = :orderId', { orderId: savedOrder.order_id })
                .getOne();

            if (!order) {
                //nếu không query lại được thì trả về savedOrder
                return {
                    ...savedOrder,
                    payment: savePayment,
                    sub_orders: subOrderTemp,

                }
            }
            this.logger.log(`Order details: ${JSON.stringify(order, null, 2)}`);
            return order;
        }
        catch (error) {
            this.logger.error(`Error during order creation transaction: ${error.message}`, error.stack);
            // Rollback transaction if any error occurs
            // chưa có logic huỷ đơn hàng của gian hàng nhanh.
            await queryRunner.rollbackTransaction();
            await this.updateProductQuantities(validSubOrders, UpdateProductQuantityOperation.INCREASE);
            throw error;
        } finally {
            // Always release the queryRunner
            await queryRunner.release();
        }

    }
    async createOrderWithTransactionForPayOS(validSubOrders: ShippingFeeDetails[], validOrderInfo: { user: User; address: Location; }, orderRequest: OrderRequestDto): Promise<Order | Issue[]> {

        try {
            await this.updateProductQuantities(validSubOrders, UpdateProductQuantityOperation.DECREASE);
            this.logger.log(`Successfully decreased product quantities before transaction`);
        } catch (error) {
            this.logger.error(`Failed to decrease product quantities: ${error.message}`);
            return [{
                reason: 'INSUFFICIENT_STOCK',
                details: `Không đủ số lượng sản phẩm: ${error.message}`,
                user_id: validOrderInfo.user.id,
            }];
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        // Bắt đầu một transaction
        await queryRunner.startTransaction();
        this.logger.log(`Starting order creation transaction for user: ${validOrderInfo?.user.id}`);
        const transactionalManager = queryRunner.manager;

        this.logger.debug(`Valid suborders: ${JSON.stringify(validSubOrders, null, 2)}`);
        try {
            const totalAmount = validSubOrders.reduce((sum, subOrder) => {
                return sum + subOrder.products.reduce((productSum, product) => {
                    return productSum + (product.price_per_unit * product.requested_quantity);
                }, 0);
            }, 0);
            const resultGHN: GhnCreatedOrderDataDto[] = await this.createOrderGHN(validSubOrders, validOrderInfo);
            //Tính tiền ship của tất cả các suborder (dựa tren kết quả từ GHN)
            const shippingAmount = resultGHN.reduce((sum, item) => sum + item.fee.main_service, 0)
            //giả sử bằng không (Vì tiền ship cao quá không test được :'(( 
            // const shippingAmount = 0;
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
            const payosOrder = await this.PayOSService.createPayOSOrder(
                savedOrder.final_amount,
                'Thanh toán từ Farmera',
                savedOrder.order_id);

            this.logger.debug(`Paytos response: ${JSON.stringify(payosOrder, null, 2)}`)

            let paymentStus: PaymentStatus;
            if (payosOrder.data.status === 'PENDING') {
                paymentStus = PaymentStatus.PENDING;
            } else if (payosOrder.data.status === 'COMPLETED') {
                paymentStus = PaymentStatus.COMPLETED;
            } else if (payosOrder.data.status === 'FAILED') {
                paymentStus = PaymentStatus.FAILED;
            } else if (payosOrder.data.status === 'CANCELED') {
                paymentStus = PaymentStatus.CANCELED;
            } else if (payosOrder.data.status === 'PROCESSING') {
                paymentStus = PaymentStatus.PROCESSING;
            }
            else {
                paymentStus = PaymentStatus.PENDING;
            }
            this.logger.debug(`Payment response by PayOS: ${JSON.stringify(payosOrder.data, null, 2)}`);
            const savePayment = await this.paymentService.create(
                {
                    amount: payosOrder.data.amount,
                    method: PaymentMethod.PAYOS,
                    status: paymentStus,
                    currency: payosOrder.data.currency,
                    transaction_id: payosOrder.data.paymentLinkId,
                    paid_at: null, // Chưa thanh toán ngay
                    qr_code: payosOrder.data.qrCode, // Đảm bảo orderCode là số
                    checkout_url: payosOrder.data.checkoutUrl, // Link thanh toán
                    signature: payosOrder.signature, // Chữ ký xác thực từ hệ thống thanh toán
                },
                savedOrder,
                transactionalManager
            );
            let subOrderTemp: SubOrder[] = [];

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
                subOrderTemp.push(createSubOrder);

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
            await queryRunner.commitTransaction();
            const order = await this.orderRepository.createQueryBuilder('order')
                .leftJoinAndSelect('order.payment', 'payment')
                .leftJoinAndSelect('order.sub_orders', 'sub_order')
                .leftJoinAndSelect('sub_order.delivery', 'delivery')
                .leftJoinAndSelect('sub_order.order_details', 'order_detail')
                .where('order.order_id = :orderId', { orderId: savedOrder.order_id })
                .getOne();
            if (!order) {
                return {
                    ...savedOrder,
                    payment: savePayment,
                    sub_orders: subOrderTemp,

                }
            }
            this.logger.log(`Order details for PAYOS: ${JSON.stringify(order, null, 2)}`);
            return order;


        } catch (error) {
            await queryRunner.rollbackTransaction();
            await this.updateProductQuantities(validSubOrders, UpdateProductQuantityOperation.INCREASE);
            throw error;
        } finally {
            // Always release the queryRunner
            await queryRunner.release();
        }
    }

    //Nhận vào danh sách các suborder và thông tin order, trả về danh sách các đơn hàng GHN đã tạo
    async createOrderGHN(validSubOrders: ShippingFeeDetails[], validOrderInfo: { user: User; address: Location; }): Promise<GhnCreatedOrderDataDto[]> {
        try {
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

                    cod_amount: subOrder.products.reduce((codSum, product) => {
                        return codSum + (product.price_per_unit * product.requested_quantity);
                    }, 0),
                    weight: 0,// trong hàm tạo order sẽ tính lại weight
                    payment_type_id: GhnPaymentTypeId.NGUOI_NHAN_THANH_TOAN,
                    required_note: GhnRequiredNote.CHO_XEM_HANG_KHONG_THU,
                    items: subOrder.products.map(product => ({
                        name: product.product_name,
                        quantity: product.requested_quantity,
                        weight: product.weight,
                        length: 0,
                        height: 0,
                        width: 0,
                        price: product.price_per_unit,
                    })),
                };
            });


            this.logger.debug(`Valid suborders for GHN: ${JSON.stringify(createGHN, null, 2)}`);

            // Tạo đơn hàng GHN
            const resultGHNPromises = createGHN.map(ghnOrder => {
                return this.deliveryService.createOrderByGHN(ghnOrder);
            });
            const resultGHN: GhnCreatedOrderDataDto[] = await Promise.all(resultGHNPromises);
            return resultGHN;
        }
        catch (error) {
            this.logger.error(`Error creating GHN order: ${error.message}`, error.stack);
            throw error;
        }
    }
    private async updateProductQuantities(
        validSubOrders: ShippingFeeDetails[],
        operation: UpdateProductQuantityOperation
    ): Promise<void> {
        try {
            const productUpdates: {
                product_id: number;
                operation: UpdateProductQuantityOperation;
                request_quantity: number;
            }[] = [];

            for (const subOrder of validSubOrders) {
                for (const product of subOrder.products) {
                    productUpdates.push({
                        product_id: product.product_id,
                        operation: operation,
                        request_quantity: product.requested_quantity

                    });
                }
            }

            this.logger.debug(`${operation} quantities for ${productUpdates.length} products`);

            const updateResult = await this.productsGrpcClientService.updateProductsQuantity(productUpdates);
            this.logger.debug(`kết quả giảm sản phẩm: ${JSON.stringify(updateResult, null, 2)}`)
            updateResult.results.map(test => 
                this.logger.log(`kết quả chi tiết giảm sản phẩm: ${JSON.stringify(test, null, 2)}`)
            )
             

            if (!updateResult.success) {
                const failedProducts = updateResult.results
                    .filter(r => !r.success)
                    .map(r => `Product ${r.product_id}: ${r.message}`);

                throw new Error(`Không thể cập nhật số lượng sản phẩm: ${failedProducts.join(', ')}`);
            }

            this.logger.log(`Successfully ${operation} quantities for ${productUpdates.length} products`);
           
        } catch (error) {
            this.logger.error(`Error ${operation} product quantities: ${error.message}`);
            throw error;
        }
    }
}