import { CategoryWithSub, Category as GrpcCategory, Subcategory as GrpcSubcategory, SubcategoryLite } from "@farmera/grpc-proto/dist/products/products";
import { Category } from "src/categories/entities/category.entity";
import { TypesMapper } from "../common/types.mapper";
import { Subcategory } from "src/categories/entities/subcategory.entity";

export class CategoryMapper {
    static toGrpcCategory(category: Category): GrpcCategory | undefined {
        if (!category) {
            return undefined;
        }
        return {
            category_id: category.category_id,
            name: category.name,
            description: category.description,
            created: TypesMapper.toGrpcTimestamp(category.created),
            image_url: category.image_url,
        };
    }

    static toGrpcSubCategory(value: Subcategory): GrpcSubcategory {
        return {
            subcategory_id: value.subcategory_id,
            name: value.name,
            description: value.description,
            created: TypesMapper.toGrpcTimestamp(value.created),
            category: this.toGrpcCategory(value.category),
        }
    }

    static toGrpcSubcategoryLite(value: Subcategory): SubcategoryLite {
        return {
            subcategory_id: value.subcategory_id,
            name: value.name,
            description: value.description,
            created: TypesMapper.toGrpcTimestamp(value.created),
        }
    }

    static toGrpcCategoryWithSubs(value: Category): CategoryWithSub {
        return {
            category_id: value.category_id,
            name: value.name,
            description: value.description,
            image_url: value.image_url,
            created: TypesMapper.toGrpcTimestamp(value.created),
            subcategories: value.subcategories.map((value) => this.toGrpcSubcategoryLite(value))
        }
    }
}