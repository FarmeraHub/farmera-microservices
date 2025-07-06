import { FarmStatus } from 'src/common/enums/product/farm-status.enum';
import { Address } from './address.entity';
import { Identification } from './identification.entity';

export class FarmAnalytics {
  total_products: number;
  total_sales: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
  followers_count: number;
  active_processes: number;
  recent_orders: number;
  top_selling_products: { product_name: string; sales: number }[];
  monthly_revenue: { month: string; revenue: number }[];
}

export class Farm {
  farm_id: string;
  farm_name: string;
  description: string;
  avatar_url: string;
  profile_image_urls: string[];
  certificate_img_urls: string[];
  email: string;
  phone: string;
  tax_number: string;
  status: FarmStatus;
  created: Date;
  updated: Date;
  address?: Address;
  identification?: Identification;
  user_id: string;
  analytics?: FarmAnalytics;
}
