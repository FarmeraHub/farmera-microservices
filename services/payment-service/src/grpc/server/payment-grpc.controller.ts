import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import {
    PaymentServiceControllerMethods,
    PaymentServiceController,
    CalculateShippingFeeRequest,
    CalculateShippingFeeResponse,
    CreateOrderRequest,
    CreateOrderResponse,
} from "@farmera/grpc-proto/dist/payment/payment";
import { Observable } from "rxjs";
import { DeliveryService } from "src/delivery/delivery.service";
import { OrdersService } from "src/orders/order/orders.service";
import { BusinessValidationService } from "src/business-validation/business-validation.service";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { DeliveryMapper } from "src/mappers/payment/delivery.mapper";
import { IssueMapper } from "src/mappers/payment/Issue.mapper";
import { OrderMapper } from "src/mappers/payment/order.mapper";
import { PaymentMapper } from "src/mappers/payment/payment.mapper";
import { SubOrderMapper } from "src/mappers/payment/suborder.mapper";
import { OrderDetailMapper } from "src/mappers/payment/order-detail.mapper";


@Controller()
@PaymentServiceControllerMethods()
export class PaymentGrpcController implements PaymentServiceController {
    private readonly logger = new Logger(PaymentGrpcController.name);
    constructor(
        private readonly deliveryService: DeliveryService,
        private readonly ordersService: OrdersService,
        private readonly businessValidationService: BusinessValidationService,
    ) {
    }

    async calculateShippingFee(request: CalculateShippingFeeRequest): Promise<CalculateShippingFeeResponse> {
        try {

            const result = await this.deliveryService.CalculateShippingFee({
                suborder: {
                    farm_id: request.suborder!.farm_id,
                    products: request.suborder!.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                },
                order_info: {
                    user_id: request.order_info!.user_id,
                    address_id: request.order_info!.address_id,
                }
            });
            if (Array.isArray(result)) {
                const issues = result.map(issue => IssueMapper.toGrpcIssue(issue));
                return { errors: { issues } };
            } else {
                const shippingFeeDetails = DeliveryMapper.toGrpcShippingFeeDetails(result);
                return { detail: shippingFeeDetails };
            }
        }
        catch (error) {
            throw ErrorMapper.toRpcException(error);
        }
    }
    async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
        try {
            this.logger.log('Received CreateOrderRequest', request);
            const result = await this.ordersService.createOrder({
                suborders: request.suborders.map(suborder => ({
                    farm_id: suborder.farm_id,
                    products: suborder.products.map(product => ({
                        product_id: product.product_id,
                        quantity: product.quantity,
                    })),
                })),
                order_info: {
                    user_id: request.order_info!.user_id,
                    address_id: request.order_info!.address_id,
                    payment_type: request.order_info?.payment_type ? request.order_info.payment_type : 'COD', 
                },
            });
            if (Array.isArray(result)) {
                const issues = result.map(issue => IssueMapper.toGrpcIssue(issue));
                return { errors: { issues } };
            } else {
                this.logger.log('Order created successfully', result);
                this.logger.log(`OrderMapper.toGrpcOrder: ${JSON.stringify(result, null, 2)}`);
                const order = OrderMapper.toGrpcOrder(result);
                const payment = result.payment ? PaymentMapper.toGrpcPayment(result.payment) : undefined;
                const suborders = {
                    suborders: result.sub_orders
                        ? result.sub_orders.map(subOrder => ({
                            sub_order: SubOrderMapper.toGrpcSubOrder(subOrder),
                            order_items: subOrder.order_details
                                ? subOrder.order_details.map(OrderDetailMapper.toGrpcOrderItem)
                                : [],
                        }))
                        : [],
                };
                const fullOrderResponse = { order, payment, suborders };
                this.logger.log(`FullOrderResponse: ${JSON.stringify(fullOrderResponse, null, 2)}`);
                return {
                    full_order: fullOrderResponse,
                }
            }

        } catch (error) {
            this.logger.error('Error creating order', error);
            throw ErrorMapper.toRpcException(error);
        }
    }



}