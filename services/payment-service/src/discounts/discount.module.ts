import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Discount } from "./entities/discount.entity";
import { DiscountUsage } from "./entities/discount-usage.entity";
import { DiscountController } from "./discount.controller";
import { DiscountService } from "./discount.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Discount,DiscountUsage]),
    ],
    controllers: [DiscountController],
    providers: [DiscountService],
    exports: [DiscountService],
})
export class DiscountModule {
}