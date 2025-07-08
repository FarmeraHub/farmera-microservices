import {
    OrderItem as GrpcOrderItem,
    
} from '@farmera/grpc-proto/dist/payment/payment';
import { OrderDetail } from 'src/payment/order/entities/order-detail.entity';
import { SubOrderMapper } from './sub-order.mapper';
export class OrderDetailMapper { 
    static fromGrpcOrderDetail(orderDetail: GrpcOrderItem): OrderDetail {
        if (!orderDetail) return undefined;

        const orderDetailEntity: OrderDetail = {
            order_detail_id: orderDetail.item_id,
            product_id: orderDetail.product_id,
            product_name: orderDetail.product_name,
            request_quantity: orderDetail.request_quantity, // Changed from quantity to request_quantity
            price_per_unit: orderDetail.price_per_unit,
            unit: orderDetail.unit,
            weight: orderDetail.weight,
            image_url: orderDetail.image_url? orderDetail.image_url : '',
            total_price: orderDetail.total_price,
        }
        if (orderDetail.sub_order) {
            orderDetailEntity.sub_order = SubOrderMapper.fromGrpcSubOrder(orderDetail.sub_order);
        }       

        return orderDetailEntity;
    }


}