import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Discount } from "./entities/discount.entity";
import { DiscountUsage } from "./entities/discount-usage.entity";

@Injectable()
export class DiscountService {
   
    constructor(
        @InjectRepository(Discount)
        private readonly discountRepository: Repository<Discount>,
        @InjectRepository(DiscountUsage)
        private readonly discountUsageRepository: Repository<DiscountUsage>,
    ) {
    }
}