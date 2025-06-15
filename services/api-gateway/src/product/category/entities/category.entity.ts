import { Subcategory } from "./subcategory.entity";

export class Category {
    category_id: number;
    name: string;
    description: string;
    image_url: string;
    created: Date;
    subcategories?: Subcategory[];
}