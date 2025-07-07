import { ProductStatus } from 'src/common/enums/product/product-status.enum';
import { Subcategory } from 'src/product/category/entities/subcategory.entity';
import { Farm } from 'src/product/farm/entities/farm.entity';
import { Process } from 'src/product/process/entities/process.entity';

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
  created: Date;
  updated: Date;
  subcategories?: Subcategory[];
  processes?: Process[];
  qr_code?: string;
  blockchain_activated: boolean;
  blockchain_hash?: string;
}
