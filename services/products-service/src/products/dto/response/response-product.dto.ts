import { ResponseFarmDto } from "src/farms/dto/response-farm.dto";
import { Farm } from "src/farms/entities/farm.entity";

export class ResponseProductDto {
    product_id: number;
    product_name: string;
    description: string;
    price_per_unit: number;
    unit: string;
    stock_quantity: number;
    weight: number; // in grams
    image_urls: string[];
    video_urls: string[];
    status: string;
    created: Date;
    updated: Date;

    farm: ResponseFarmDto;
    categories: {
        category: string;
        subcategories: string[];
    }[];
    constructor(partial: Partial<ResponseProductDto>) {
        Object.assign(this, partial);
    }

}