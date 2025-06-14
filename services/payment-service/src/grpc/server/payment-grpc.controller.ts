import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";


@Controller()
export class PaymentGrpcController {
    private readonly logger = new Logger(PaymentGrpcController.name);
    constructor() {
    }

   
    
}