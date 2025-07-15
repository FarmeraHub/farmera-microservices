import { CategoryWithSub, GetCategoryTreeResponse, Category as GrpcCategory, Subcategory as GrpcSubcategory, SubcategoryLite } from "@farmera/grpc-proto/dist/products/products";
import { TypesMapper } from "../common/types.mapper";
import { Category } from "src/product/category/entities/category.entity";
import { Subcategory } from "src/product/category/entities/subcategory.entity";

export class CategoryMapper {

    static fromGrpcCategory(value: GrpcCategory): Category {
        return {
            category_id: value.category_id,
            name: value.name,
            description: value.description,
            image_url: value.image_url,
            created: TypesMapper.fromGrpcTimestamp(value.created!),
        }
    }

    static fromGrpcSubcategory(value: GrpcSubcategory): Subcategory {
        return {
            subcategory_id: value.subcategory_id,
            name: value.name,
            description: value.description,
            created: TypesMapper.fromGrpcTimestamp(value.created!),
            category: CategoryMapper.fromGrpcCategory(value.category!),
        }
    }

    static fromGrpcSubcategoryLite(value: SubcategoryLite): Subcategory {
        return {
            subcategory_id: value.subcategory_id,
            name: value.name,
            description: value.description,
            created: TypesMapper.fromGrpcTimestamp(value.created!)
        }
    }

    static fromGetCategoryTreeResponse(value: GetCategoryTreeResponse): Category {
        if (!value.category) {
            throw new Error("Category not found in GetCategoryTreeResponse");
        }
        return {
            category_id: value.category.category_id,
            name: value.category.name,
            description: value.category.description,
            image_url: value.category.image_url,
            created: TypesMapper.fromGrpcTimestamp(value.category.created!),
            subcategories: value.sublist.map((value) => this.fromGrpcSubcategoryLite(value))
        }
    }

    static fromGrpcCategoryWithSubs(value: CategoryWithSub): Category {
        return {
            category_id: value.category_id,
            name: value.name,
            description: value.description,
            image_url: value.image_url,
            created: TypesMapper.fromGrpcTimestamp(value.created!),
            subcategories: value.subcategories.map((value) => this.fromGrpcSubcategoryLite(value))
        }
    }
}