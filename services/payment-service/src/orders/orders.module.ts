import { DeliveryModule } from './../delivery/delivery.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from "@nestjs/common";
import { Order } from './entities/order.entity';
import { SubOrder } from './entities/sub-order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { DiscountModule } from 'src/discounts/discount.module';
import { PaymentModule } from 'src/payments/payment.module';
import { BusinessValidationModule } from 'src/business-validation/business-validation.module';
import { OrdersService } from './order/orders.service';
import { OrderDetailService } from './order-detail/order-detail.service';
import { SubOrderService } from './sub-order/sub-order.service';
import { PayOSModule } from 'src/payos/payos.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, SubOrder, OrderDetail]),
        DiscountModule,
        PaymentModule,
        DiscountModule,
        DeliveryModule,
        BusinessValidationModule,
        PayOSModule,
    ],
    providers: [OrdersService,OrderDetailService, SubOrderService],
    exports: [OrdersService, OrderDetailService, SubOrderService],
})
export class OrdersModule { }