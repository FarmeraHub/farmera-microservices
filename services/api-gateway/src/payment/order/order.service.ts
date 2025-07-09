import { PaymentServiceClient } from "@farmera/grpc-proto/dist/payment/payment";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { OrderRequestDto } from "./dto/order.dto";
import { Issue } from "./entities/issue.entity";
import { Order } from "./entities/order.entity";
import { SubOrder, SubOrderWithDetail } from "./entities/sub-order.entity";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { firstValueFrom } from "rxjs";
import { IssueMapper } from "src/mappers/payment/issue.mapper";
import { OrderMapper } from "src/mappers/payment/order.mapper";
import { Payment } from "../payment/entities/payment.entity";
import { PaymentMapper } from "src/mappers/payment/payment.mapper";
import { SubOrderMapper } from "src/mappers/payment/sub-order.mapper";
import { OrderDetailMapper } from "src/mappers/payment/order-detail.mapper";

@Injectable()
export class OrderService implements OnModuleInit {
    private readonly logger = new Logger(OrderService.name);
    private orderGrpcService: PaymentServiceClient;
    constructor(
        @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
    ) {

    }
    onModuleInit() {
        this.orderGrpcService = this.clientGrpcInstance.getService<PaymentServiceClient>("PaymentService");
    }

    async createOrder(userId: string, order: OrderRequestDto): Promise<{ order: Order, payment?: Payment, suborderwithDetail?: SubOrderWithDetail[] } | Issue[]> {
        try {
            const result = await firstValueFrom(this.orderGrpcService.createOrder({
                suborders: order.suborders.map(suborder => ({
                    farm_id: suborder.farm_id,
                    products: suborder.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                })),
                order_info: {
                    user_id: userId,
                    address_id: order.order_info.address_id,
                    payment_type: order.order_info.payment_type? order.order_info.payment_type : undefined,
                }
            }));

            if (result.errors && result.errors.issues && Array.isArray(result.errors.issues)) {
                const issues: Issue[] = result.errors.issues.map(issue => IssueMapper.fromGrpcIssue(issue));
                return issues;
            }
            if (Array.isArray(result)) {
                const issues: Issue[] = result.map(issue => IssueMapper.fromGrpcIssue(issue));
                return issues;
            }
            if (result.full_order) {
                const orderData = result.full_order.order;
                const paymentData = result.full_order?.payment;
                const subordersData = result.full_order?.suborders;

                if (!orderData) {
                    throw new Error('Order data not found in response');
                }

                const orderEntity = OrderMapper.fromGrpcOrder(orderData);

                let paymentEntity: Payment | undefined = undefined;
                if (paymentData) {
                    paymentEntity = PaymentMapper.fromGrpcPayment(paymentData);
                }

                
                let suborderwithDetail: SubOrderWithDetail[] | undefined = undefined;
                
                if (subordersData && Array.isArray(subordersData)) {
                    suborderwithDetail = subordersData.map(suborder => {
                        const subOrderEntity = SubOrderMapper.fromGrpcSubOrder(suborder.sub_order);
                        const products = suborder.order_items.map(product => OrderDetailMapper.fromGrpcOrderDetail(product));
                        return { sub_order: subOrderEntity, products };
                    });
                }

                return {
                    order: orderEntity,
                    payment: paymentEntity,
                    suborderwithDetail: suborderwithDetail,
                };
            }
            this.logger.debug(`result: ${JSON.stringify(result, null, 2)}`, 'OrderService');
            throw new Error('Invalid response structure from payment service');
        } catch (error) {
            throw ErrorMapper.fromGrpcError(error);
        }
    }

}