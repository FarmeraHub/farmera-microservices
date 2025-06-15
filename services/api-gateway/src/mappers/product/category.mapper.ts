import { Category as GrpcCategory, ProductSubcategoryDetail as GrpcProductSubcategoryDetail, Subcategory as GrpcSubcategory } from "@farmera/grpc-proto/dist/products/products";
import { Category } from "src/product/category/entities/category.entity";
import { Subcategory } from "src/product/category/entities/subcategory.entity";
import { ProductSubcategoryDetail } from "src/product/product/entities/product-subcategory-detail.entity";

export class CategoryMapper {

    static fromGrpcCategory(value: GrpcCategory): Category {
        return
    }

    static fromGrpcProductSubcategoryDetail(value: GrpcProductSubcategoryDetail): ProductSubcategoryDetail {
        return
    }

    static fromGrpcSubcategory(value: GrpcSubcategory): Subcategory {
        return
    }
}