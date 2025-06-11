import { Module } from "@nestjs/common";
import { Delivery } from "./enitites/delivery.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [HttpModule,
        TypeOrmModule.forFeature([Delivery]),
    ],
    controllers: [DeliveryController],
    providers: [DeliveryService],
    exports: [DeliveryService],
})
export class DeliveryModule { }