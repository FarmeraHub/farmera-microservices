import {
  Order as GrpcOrder,
  FullOrderResponse as GrpcFullOrderResponse,
  OrderWithItems as GrpcOrderWithItems,
  ShippingAddress as GrpcShippingAddress,
} from '@farmera/grpc-proto/dist/payment/payment';
import { TypesMapper } from '../common/types.mapper';
import { EnumMapper } from '../common/enum.mapper';
import { SubOrderMapper } from './suborder.mapper';
import { PaymentMapper } from './payment.mapper';
import { Order } from 'src/orders/entities/order.entity';
import { OrderDetailMapper } from './order-detail.mapper';
import { Location } from 'src/user/entities/location.entity';

export class OrderMapper {
  static toGrpcOrder(
    value: Order & { shipping_address?: Location },
  ): GrpcOrder {
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
      shipping_address: value.shipping_address
        ? this.toGrpcShippingAddress(value.shipping_address)
        : undefined,
    };
  }

  static toGrpcShippingAddress(location: Location): GrpcShippingAddress {
    return {
      location_id: location.location_id,
      name: location.name,
      phone: location.phone,
      address_line: location.address_line,
      city: location.city,
      district: location.district,
      ward: location.ward,
      street: location.street,
      type: location.type,
      is_primary: location.is_primary,
    };
  }

  static toGrpcOrderWithItems(
    value: Order & { shipping_address?: Location },
  ): GrpcOrderWithItems {
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
