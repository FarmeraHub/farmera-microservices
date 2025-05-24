import { Controller } from "@nestjs/common";
import { DeliveryService } from "./delivery.service";

@Controller('delivery')
export class DeliveryController {
    constructor(
    private readonly deliveryService: DeliveryService, // Assuming you have a DeliveryService
    ) {
        // Initialize any dependencies or services here if needed
    }
}