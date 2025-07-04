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
import { DeliveryEnumMapper } from "src/mappers/payment/delivery.mapper";
import { IssueMapper } from "src/mappers/payment/Issue.mapper";
import { OrderMapper } from "src/mappers/payment/order.mapper";


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
                    farm_id: request.suborders!.farm_id,
                    products: request.suborders!.products.map(product => ({
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
                const shippingFeeDetails = DeliveryEnumMapper.toGrpcShippingFeeDetails(result);
                return { details: shippingFeeDetails };
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
                    payment_method: 'COD',
                },
            });
            if (Array.isArray(result)) {
                const issues = result.map(issue => IssueMapper.toGrpcIssue(issue));
                return { errors: { issues } };
            } else {
                this.logger.log('Order created successfully', result);
                this.logger.log(`OrderMapper.toGrpcOrder: ${JSON.stringify(result, null, 2)}`);
                const order = OrderMapper.toGrpcOrder(result);
                return { order: order };
            }

            } catch (error) {
                this.logger.error('Error creating order', error);
                throw ErrorMapper.toRpcException(error);
            }
        }

    

}