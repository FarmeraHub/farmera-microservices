import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { Product } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductAdminService {

    constructor(@InjectRepository(Product)
    private readonly productsRepository: Repository<Product>) { }

    async updateProductStatus(productId: number, status: ProductStatus) {
        const result = await this.productsRepository.update(productId, { status: status });
        if (result.affected && result.affected > 0) {
            return true;
        } else {
            return false
        }
    }
}
