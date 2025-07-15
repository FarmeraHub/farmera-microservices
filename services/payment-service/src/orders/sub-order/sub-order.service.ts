import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubOrder } from '../entities/sub-order.entity';
import { EntityManager, Repository } from 'typeorm';
import { SubOrderDto } from '../dto/sub-order.dto';
import { Order } from '../entities/order.entity';
import { CreateSubOrderDto } from '../dto/create-sub-order.dto';

@Injectable()
export class SubOrderService {
    constructor(
        @InjectRepository(SubOrder)
        private readonly subOrderRepository: Repository<SubOrder>,

    ) { }

    create(subOrder: CreateSubOrderDto,
        order: Order,
        transactionalManager: EntityManager): Promise<SubOrder>;
    async create(subOrder: CreateSubOrderDto,
        order: Order,
        transactionalManager: EntityManager): Promise<SubOrder> {
        {
            const newSubOrder = transactionalManager.create(SubOrder, {
                farm_id: subOrder.farm_id,
                status: subOrder.status,
                total_amount: subOrder.total_amount,
                discount_amount: subOrder.discount_amount,
                shipping_amount: subOrder.shipping_amount,
                final_amount: subOrder.final_amount,
                currency: subOrder.currency,
                avatar_url: subOrder.avatar_url,
                notes: subOrder.notes,
                order: order,
            });
            return transactionalManager.save(newSubOrder);
        }

    }
}