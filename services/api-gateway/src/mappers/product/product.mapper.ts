import { Product as GrpcProduct } from "@farmera/grpc-proto/dist/products/products";
import { Product } from "src/product/product/entities/product.entity";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";

export class ProductMapper {
    static fromGrpcProduct(value: GrpcProduct): Product {
        return {
            product_id: value.product_id,
            product_name: value.product_name,
            description: value.description,
            price_per_unit: value.price_per_unit,
            unit: value.unit,
            stock_quantity: value.stock_quantity,
            weight: value.weight,
            image_urls: value.image_urls,
            video_urls: value.video_urls,
            status: EnumMapper.fromGrpcProductStatus(value.status),
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
            productSubcategoryDetails: [],
            average_rating: value.average_rating,
            total_sold: value.total_sold,
        }
    }
}