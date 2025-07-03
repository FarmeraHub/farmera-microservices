import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderDetail } from 'src/orders/entities/order-detail.entity';
import { Product } from 'src/product/product/entities/product.entity';
import { EntityManager, Repository } from 'typeorm';
import { SubOrder } from '../entities/sub-order.entity';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private readonly orderDetailRepository: Repository<OrderDetail>,

    ) { }
    create(
        product: Product,
        subOrder: SubOrder,
        quantity: number,
        transactionalManager: EntityManager
    ): Promise<OrderDetail>;

    async create(product: Product, subOrder: SubOrder, quantity: number, transactionalManager: EntityManager): Promise<OrderDetail> {
        const newOrderDetail = transactionalManager.create(OrderDetail, {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: quantity,
            price_per_unit: product.price_per_unit,
            unit: product.unit,
            weight: product.weight,
            image_url: product.image_urls ? product.image_urls[0] : '',
            total_price: product.price_per_unit * quantity,
            sub_order: subOrder,
        });
        return transactionalManager.save(newOrderDetail);
    }

}
