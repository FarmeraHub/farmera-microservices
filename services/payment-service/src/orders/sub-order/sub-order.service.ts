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
  ) {}

  create(
    subOrder: CreateSubOrderDto,
    order: Order,
    transactionalManager: EntityManager,
  ): Promise<SubOrder>;
  async create(
    subOrder: CreateSubOrderDto,
    order: Order,
    transactionalManager: EntityManager,
  ): Promise<SubOrder> {
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

  async getSubOrdersByCustomerId(
    customerId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    subOrders: SubOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.subOrderRepository
      .createQueryBuilder('sub_order')
      .leftJoinAndSelect('sub_order.order', 'order')
      .leftJoinAndSelect('sub_order.delivery', 'delivery')
      .leftJoinAndSelect('sub_order.order_details', 'order_detail')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.customer_id = :customerId', { customerId });

    if (status) {
      queryBuilder.andWhere('sub_order.status = :status', { status });
    }

    const offset = (page - 1) * limit;
    queryBuilder.orderBy('sub_order.created', 'DESC').skip(offset).take(limit);

    const [subOrders, total] = await queryBuilder.getManyAndCount();

    return {
      subOrders,
      total,
      page,
      limit,
    };
  }

  async getSubOrdersByFarmId(
    farmId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    subOrders: SubOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.subOrderRepository
      .createQueryBuilder('sub_order')
      .leftJoinAndSelect('sub_order.order', 'order')
      .leftJoinAndSelect('sub_order.delivery', 'delivery')
      .leftJoinAndSelect('sub_order.order_details', 'order_detail')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('sub_order.farm_id = :farmId', { farmId });

    if (status) {
      queryBuilder.andWhere('sub_order.status = :status', { status });
    }

    const offset = (page - 1) * limit;
    queryBuilder.orderBy('sub_order.created', 'DESC').skip(offset).take(limit);

    const [subOrders, total] = await queryBuilder.getManyAndCount();

    return {
      subOrders,
      total,
      page,
      limit,
    };
  }

  async getSubOrderById(subOrderId: number): Promise<SubOrder> {
    const suborder = await this.subOrderRepository.findOne({
      where: { sub_order_id: subOrderId },
      relations: ['order', 'delivery', 'order_details', 'order.payment'],
    });
    if (!suborder) {
      throw new Error(`SubOrder with ID ${subOrderId} not found`);
      }
    console.log(`SubOrder retrieved: ${JSON.stringify(suborder,null, 2)}`);
    return suborder;
  }
}
