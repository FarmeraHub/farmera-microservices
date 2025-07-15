import { Category } from "./category.entity";

export class Subcategory {
    subcategory_id: number;
    name: string;
    description?: string;
    created?: Date;
    category?: Category;
}