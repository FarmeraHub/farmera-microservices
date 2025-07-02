import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderDetail } from 'src/orders/entities/order-detail.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private readonly orderDetailRepository: Repository<OrderDetail>,
        
    ){}
}
