import { ProductSubcategoryDetail } from './product-subcategory-detail.entity';
import { ProductStatus } from 'src/common/enums/product/product-status.enum';

export class Product {
  product_id: number;
  product_name: string;
  description: string;
  price_per_unit: number;
  unit: string;
  stock_quantity: number;
  weight: number; // in grams
  total_sold: number;
  average_rating: number;
  image_urls: string[];
  video_urls: string[];
  status: ProductStatus;
  created: Date;
  updated: Date;
  productSubcategoryDetails: ProductSubcategoryDetail[];
}
