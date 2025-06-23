import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { OrdersModule } from './orders/orders.module';
import productServiceConfig from './config/product-service.config';
import { PaymentModule } from './payments/payment.module';
import { DiscountModule } from './discounts/discount.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PaymentGrpcServerModule } from './grpc/server/payment-grpc.server.module';
import { PaymentGrpcClientModule } from './grpc/client/grpc-client.module';
import { NotificationModule } from './clients/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [productServiceConfig],
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    OrdersModule,
    PaymentModule,
    DiscountModule,
    DeliveryModule,
    PaymentGrpcServerModule,
    PaymentGrpcClientModule, ,
    NotificationModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
