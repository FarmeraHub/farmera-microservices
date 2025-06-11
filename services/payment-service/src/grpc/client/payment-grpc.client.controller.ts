import { Body, Controller, Logger, Post } from "@nestjs/common";
import { PaymentGrpcClientService } from "./payment-grpc.client.service";
import { ListProductsDtoGrpcRequest } from "./dto/request/product-grpc.request.dto";
import { ListProductsDtoGrpcResponse } from "./dto/response/product-grpc.response.dto";




@Controller()
export class PaymentGrpcClientController {
    private readonly logger = new Logger(PaymentGrpcClientController.name);
    constructor(
        private readonly paymentGrpcClientService: PaymentGrpcClientService,
    ) { }

    @Post('list-products')
    async listProducts(
        @Body() body: ListProductsDtoGrpcRequest,
    ): Promise<any> {

        try {
            this.logger.log(`Calling gRPC ListProducts with product_id: ${body}`);
            return await this.paymentGrpcClientService.getListProducts(body);
        } catch (error) {
            this.logger.error(`Error calling gRPC ListProducts from HTTP controller: ${error.message}`, error.stack);
            throw error;
        }
    }
}