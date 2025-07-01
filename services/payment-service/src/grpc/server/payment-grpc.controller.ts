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
import { OrdersService } from "src/orders/orders.service";
import { BusinessValidationService } from "src/business-validation/business-validation.service";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { DeliveryEnumMapper } from "src/mappers/payment/delivery.mapper";


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
                suborders: {
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
                const issues = result.map(issue => DeliveryEnumMapper.toGrpcIssue(issue));
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
    async createOrder(request: CreateOrderRequest): Promise<any> { }

    

}