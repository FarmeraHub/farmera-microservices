import { PaymentServiceClient } from '@farmera/grpc-proto/dist/payment/payment';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Order } from '../order/entities/order.entity';
import { OrderMapper } from 'src/mappers/payment/order.mapper';
import { SubOrder } from '../order/entities/sub-order.entity';
import { OrderDetail } from '../order/entities/order-detail.entity';
import { SubOrderMapper } from 'src/mappers/payment/sub-order.mapper';
import { OrderDetailMapper } from 'src/mappers/payment/order-detail.mapper';
import { PaymentMapper } from 'src/mappers/payment/payment.mapper';
import { Payment } from '../payment/entities/payment.entity';

@Injectable()
export class SubOrderService implements OnModuleInit {
  // This service is currently empty, but can be extended in the future
  // to handle sub-order specific logic or operations.
  private readonly logger = new Logger(SubOrderService.name);
  private paymentGrpcService: PaymentServiceClient;

  constructor(
    @Inject('PAYMENT_PACKAGE') private readonly clientGrpcInstance: ClientGrpc,
  ) {}
  onModuleInit() {
    this.paymentGrpcService =
      this.clientGrpcInstance.getService<PaymentServiceClient>(
        'PaymentService',
      );
  }

  async getSubOrderById(subOrderId: number): Promise<{
    order?: Order;
    payment?: Payment;
    suborderDetail: { suborder: SubOrder; detail: OrderDetail[] };
  }> {
    try {
      const result = await firstValueFrom(
        this.paymentGrpcService.getSubOrderById({ suborder_id: subOrderId }),
      );

      return {
        order: result.order
          ? OrderMapper.fromGrpcOrder(result.order)
          : undefined,
        payment: result.payment
          ? PaymentMapper.fromGrpcPayment(result.payment)
          : undefined,
        suborderDetail: {
          suborder: SubOrderMapper.fromGrpcSubOrder(result.suborder.sub_order),
          detail: result.suborder.order_items.map((detail) =>
            OrderDetailMapper.fromGrpcOrderDetail(detail),
          ),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get sub-order by ID: ${subOrderId}`, error);
      throw error; // Re-throw the error for further handling
    }
  }

  async getSubOrdersByUser(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    subOrders: {
      order?: Order;
      payment?: Payment;
      suborderDetail: { suborder: SubOrder; detail: OrderDetail[] };
    }[];
    page: number;
    limit: number;
  }> {
    try {
      const result = await firstValueFrom(
        this.paymentGrpcService.getSubOrdersByUser({
          user_id: userId,
          status: status,
          pagination: { page, limit },
        }),
      );

      return {
        subOrders: result.suborders.map((sub) => ({
          order: sub.order ? OrderMapper.fromGrpcOrder(sub.order) : undefined,
          payment: sub.payment
            ? PaymentMapper.fromGrpcPayment(sub.payment)
            : undefined,
          suborderDetail: {
            suborder: SubOrderMapper.fromGrpcSubOrder(sub.suborder.sub_order),
            detail: sub.suborder.order_items.map((detail) =>
              OrderDetailMapper.fromGrpcOrderDetail(detail),
            ),
          },
        })),
        page: result.pagination.current_page,
        limit: result.pagination.page_size,
      };
    } catch (error) {
      this.logger.error(`Failed to get sub-orders for user ${userId}`, error);
      throw error; // Re-throw the error for further handling
    }
  }

  async getSubOrdersByFarm(
    farm_id: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    subOrders: {
      order?: Order;
      payment?: Payment;
      suborderDetail: { suborder: SubOrder; detail: OrderDetail[] };
    }[];
    page: number;
    limit: number;
  }> {
    try {
      const result = await firstValueFrom(
        this.paymentGrpcService.getSubOrdersByFarm({
          farm_id: farm_id,
          status: status,
          pagination: { page, limit },
        }),
      );

      return {
        subOrders: result.suborders.map((sub) => ({
          order: sub.order ? OrderMapper.fromGrpcOrder(sub.order) : undefined,
          payment: sub.payment
            ? PaymentMapper.fromGrpcPayment(sub.payment)
            : undefined,
          suborderDetail: {
            suborder: SubOrderMapper.fromGrpcSubOrder(sub.suborder.sub_order),
            detail: sub.suborder.order_items.map((detail) =>
              OrderDetailMapper.fromGrpcOrderDetail(detail),
            ),
          },
        })),
        page: result.pagination.current_page,
        limit: result.pagination.page_size,
      };
    } catch (error) {
      this.logger.error(`Failed to get sub-orders for farm ${farm_id}`, error);
      throw error; // Re-throw the error for further handling
    }
  }
}
