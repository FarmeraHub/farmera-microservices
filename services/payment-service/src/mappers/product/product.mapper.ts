import { Product as GrpcProduct } from "@farmera/grpc-proto/dist/products/products";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";
import { FarmMapper } from "./farm.mapper";
import { CategoryMapper } from "./category.mapper";
import { ProcessMapper } from "./process.mapper";
import { Product } from "src/product/product/entities/product.entity";

export class ProductMapper {
    static fromGrpcProduct(value: GrpcProduct): Product | undefined {
        if (!value) return undefined;
        return {
            product_id: value.product_id,
            product_name: value.product_name,
            description: value.description,
            price_per_unit: value.price_per_unit,
            unit: value.unit,
            stock_quantity: value.stock_quantity,
            weight: value.weight,
            total_sold: value.total_sold,
            average_rating: value.average_rating,
            image_urls: value.image_urls?.list,
            video_urls: value.video_urls?.list,
            status: EnumMapper.fromGrpcProductStatus(value.status),
            created: TypesMapper.fromGrpcTimestamp(value.created!),
            updated: TypesMapper.fromGrpcTimestamp(value.updated!),
            farm: FarmMapper.fromGrpcFarm(value.farm!),
            subcategories: value.subcategories?.subcategories.map((value) =>
                CategoryMapper.fromGrpcSubcategoryLite(value),
            ),
            // processes: value.processes?.process.map((value) =>
            //     ProcessMapper.fromGrpcProcessLite(value),
            // )
        }
    }
}