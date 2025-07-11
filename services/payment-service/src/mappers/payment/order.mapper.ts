import {
  Order as GrpcOrder,
  FullOrderResponse as GrpcFullOrderResponse,
  OrderWithItems as GrpcOrderWithItems,
} from '@farmera/grpc-proto/dist/payment/payment';
import { TypesMapper } from '../common/types.mapper';
import { EnumMapper } from '../common/enum.mapper';
import { SubOrderMapper } from './suborder.mapper';
import { PaymentMapper } from './payment.mapper';
import { Order } from 'src/orders/entities/order.entity';
import { OrderDetailMapper } from './order-detail.mapper';

export class OrderMapper {
  static toGrpcOrder(value: Order): GrpcOrder {
    return {
      order_id: value.order_id,
      customer_id: value.customer_id,
      address_id: value.address_id,
      total_amount: value.total_amount,
      shipping_amount: value.shipping_amount,
      final_amount: value.final_amount,
      status: EnumMapper.toGrpcOrderStatus(value.status),
      created: TypesMapper.toGrpcTimestamp(value.created),
      updated: TypesMapper.toGrpcTimestamp(value.updated),
      currency: value.currency,
    };
  }

  static toGrpcOrderWithItems(value: Order): GrpcOrderWithItems {
    const grpcOrder = this.toGrpcOrder(value);

    const subOrdersWithDetail =
      value.sub_orders?.map((subOrder) => ({
        sub_order: SubOrderMapper.toGrpcSubOrder(subOrder),
        order_items:
          subOrder.order_details?.map((orderDetail) =>
            OrderDetailMapper.toGrpcOrderItem(orderDetail),
          ) || [],
      })) || [];

    return {
      order: grpcOrder,
      sub_orders: subOrdersWithDetail,
    };
  }
}
