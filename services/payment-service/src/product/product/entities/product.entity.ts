import { ProductStatus } from "src/common/enums/product/product-status.enum";
import { Farm } from "../../farm/entities/farm.entity";
import { Subcategory } from "../../category/entities/subcategory.entity";
import { Process } from "../../process/entities/process.entity";

export class Product {
    product_id: number;
    farm?: Farm;
    product_name: string;
    description: string;
    price_per_unit: number;
    unit: string;
    stock_quantity: number;
    weight: number;
    total_sold: number;
    average_rating: number;
    image_urls?: string[];
    video_urls?: string[];
    status: ProductStatus;
    created?: Date;
    updated?: Date;
    subcategories?: Subcategory[];
    //processes?: Process[] | undefined;
}
