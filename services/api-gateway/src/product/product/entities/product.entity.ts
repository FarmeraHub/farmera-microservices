import { ProductStatus } from 'src/common/enums/product/product-status.enum';
import { Subcategory } from 'src/product/category/entities/subcategory.entity';
import { Farm } from 'src/product/farm/entities/farm.entity';
import { ProcessLite } from 'src/product/process/dto/process-lite.dto';
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
  process?: Process | ProcessLite;
  qr_code?: string;
  blockchain_activated: boolean;
  blockchain_transaction_hash?: string;
}
