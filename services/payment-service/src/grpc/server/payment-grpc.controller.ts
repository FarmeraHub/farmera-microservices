import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import {
    PaymentServiceControllerMethods,
    PaymentServiceController,
    CalculateShippingFeeRequest,
    CalculateShippingFeeResponse,
} from "@farmera/grpc-proto/dist/payment/payment";
import { Observable } from "rxjs";


@Controller()
@PaymentServiceControllerMethods()
export class PaymentGrpcController implements PaymentServiceController {
    private readonly logger = new Logger(PaymentGrpcController.name);
    constructor(

    ) {
    }

    async calculateShippingFee(request: CalculateShippingFeeRequest): Promise<CalculateShippingFeeResponse> {
        try {
            throw new Error('Method not implemented. This is a placeholder for the gRPC service implementation.');
        }
        catch (error) {
            this.logger.error('Error in calculateShippingFee:', error);
            throw error; // Re-throw the error for further handling
        }
    }

}