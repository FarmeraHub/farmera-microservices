import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderDetail } from 'src/orders/entities/order-detail.entity';
import { EntityManager, Repository } from 'typeorm';
import { SubOrder } from '../entities/sub-order.entity';
import { Item } from 'src/delivery/enitites/cart.entity';

@Injectable()
export class OrderDetailService {
  constructor(
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
  ) {}
  create(
    product: Item,
    subOrder: SubOrder,
    transactionalManager: EntityManager,
  ): Promise<OrderDetail>;

  async create(
    product: Item,
    subOrder: SubOrder,
    transactionalManager: EntityManager,
  ): Promise<OrderDetail> {
    const newOrderDetail = transactionalManager.create(OrderDetail, {
      product_id: product.product_id,
      product_name: product.product_name,
      request_quantity: product.requested_quantity,
      price_per_unit: product.price_per_unit,
      unit: product.unit,
      weight: product.weight,
      image_url:
        product.image_url || '/assets/images/products/product_placeholder.png',
      total_price: product.price_per_unit * product.requested_quantity,
      sub_order: subOrder,
    });
    return transactionalManager.save(newOrderDetail);
  }
}
