import { DeliveryModule } from './../delivery/delivery.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from "@nestjs/common";
import { Order } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SubOrder } from './entities/sub-order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { ProductClientModule } from 'src/clients/product/product.client.module';
import { DiscountModule } from 'src/discounts/discount.module';
import { PaymentModule } from 'src/payments/payment.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, SubOrder, OrderDetail]),
        ProductClientModule,
        DiscountModule,
        PaymentModule,
        DiscountModule,
        DeliveryModule,
        ProductClientModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }