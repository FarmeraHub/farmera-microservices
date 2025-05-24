import { registerAs } from '@nestjs/config';

export default registerAs('productService', () => ({
  baseUrl: process.env.PRODUCT_SERVICE_BASE_URL,
  timeout: parseInt(process.env.PRODUCT_SERVICE_TIMEOUT || '5000', 10),
  apiKey: process.env.PRODUCT_SERVICE_API_KEY,
}));