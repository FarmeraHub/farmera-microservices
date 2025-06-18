import { Product as GrpcProduct } from "@farmera/grpc-proto/dist/products/products";
import { Product } from "src/products/entities/product.entity";
import { EnumsMapper } from "../common/enums.mapper";
import { TypesMapper } from "../common/types.mapper";
import { CategoryMapper } from "./category.mapper";
import { ProcessMapper } from "./process.mapper";
import { FarmMapper } from "./farm.mapper";

export class ProductMapper {
    static toGrpcProduct(value: Product): GrpcProduct {
        return {
            product_id: value.product_id,
            product_name: value.product_name,
            description: value.description,
            price_per_unit: value.price_per_unit,
            unit: value.unit,
            stock_quantity: value.stock_quantity,
            weight: value.weight,
            image_urls: value.image_urls ? { list: value.image_urls } : undefined,
            video_urls: value.video_urls ? { list: value.video_urls } : undefined,
            status: EnumsMapper.toGrpcProductStatus(value.status),
            created: TypesMapper.toGrpcTimestamp(value.created),
            updated: TypesMapper.toGrpcTimestamp(value.updated),
            subcategories: value.subcategories ?
                { subcategories: value.subcategories.map((subcategory) => CategoryMapper.toGrpcSubcategoryLite(subcategory)) } : undefined,
            average_rating: value.average_rating,
            total_sold: value.total_sold,
            farm: value.farm ? FarmMapper.toGrpcFarm(value.farm) : undefined,
            processes: value.processes ? { process: value.processes.map((process) => ProcessMapper.toGrpcProcessLite(process)) } : undefined,
        }
    }
}