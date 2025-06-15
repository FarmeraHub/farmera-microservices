# Products Service Integration

This module provides comprehensive integration with the Products microservice, offering endpoints for managing products, categories, and farms with full CRUD operations, advanced filtering, pagination, and file upload support.

## Features

- **Complete Products Management**: Create, read, update, delete products with images/videos
- **Categories & Subcategories**: Hierarchical category management with admin controls
- **Farm Management**: Registration, verification, and comprehensive farm operations
- **Advanced Search & Filtering**: Multi-criteria search with pagination support
- **Role-based Access Control**: Different permissions for customers, farmers, and admins
- **File Upload Support**: Multi-file upload for products and farm documentation
- **Admin Tools**: Farm status management and approval workflows

## API Endpoints

### Products

#### `GET /products`

Search and filter products with pagination

- **Query Parameters**:
  - `search` (string): Search term for product name/description
  - `category` (number): Category ID filter
  - `subcategory` (number): Subcategory ID filter
  - `minPrice` (number): Minimum price filter
  - `maxPrice` (number): Maximum price filter
  - `farmId` (string): Farm ID filter
  - `status` (ProductStatus): Product status filter
  - `page` (number): Page number (default: 1)
  - `limit` (number): Items per page (default: 10, max: 100)
  - `sort_by` (string): Sort field (price, name, created, rating, sold)
  - `order` (asc|desc): Sort order (default: desc)
  - `all` (boolean): Return all results without pagination

#### `GET /products/:id`

Get product by ID with full details

#### `POST /products`

Create new product (Farmers & Admins only)

- **Content-Type**: `multipart/form-data`
- **Files**:
  - `product_images[]`: Up to 5 product images
  - `product_videos[]`: Up to 2 product videos
- **Body**: CreateProductDto

#### `PUT /products/:id`

Update product by ID (Farmers & Admins only)

- **Content-Type**: `multipart/form-data`
- **Files**: Same as create
- **Body**: UpdateProductDto

#### `DELETE /products/:id`

Delete product by ID (Farmers & Admins only)

#### `POST /products/bulk`

Get multiple products by IDs

- **Body**: `{ product_ids: number[] }`

### Categories

#### `GET /products/categories`

Get all categories with subcategories

- **Query Parameters**: Standard pagination options

#### `GET /products/categories/:id`

Get category by ID with subcategories

#### `POST /products/categories`

Create new category (Admins only)

- **Body**: CreateCategoryDto

#### `GET /products/subcategories/:id`

Get subcategory by ID

#### `POST /products/subcategories`

Create new subcategory (Admins only)

- **Body**: CreateSubcategoryDto

### Farms

#### `GET /products/farms`

Get farms with filters and pagination

- **Query Parameters**:
  - `search` (string): Search farm name, email, or city
  - `status` (FarmStatus): Farm status filter
  - `city` (string): City filter
  - Standard pagination options

#### `GET /products/farms/:id`

Get farm by ID

- **Query Parameters**:
  - `include_products` (boolean): Include farm's products

#### `GET /products/farms/my/farm`

Get current user's farm

- **Query Parameters**:
  - `include_products` (boolean): Include farm's products

#### `POST /products/farms/register`

Register new farm

- **Content-Type**: `multipart/form-data`
- **Files**:
  - `cccd[]`: Citizen ID card images
  - `biometric_video[]`: Biometric verification video
- **Body**: RegisterFarmDto

#### `PUT /products/farms/:id`

Update farm by ID

- **Content-Type**: `multipart/form-data`
- **Files**:
  - `avatar[]`: Farm avatar image
  - `profile_images[]`: Farm profile images
  - `certificate_images[]`: Certificate images
- **Body**: UpdateFarmDto

### Admin Farm Management

#### `PUT /products/admin/farms/:id/status`

Update farm status (Admins only)

- **Body**: UpdateFarmStatusDto

## Data Models

### ProductStatus Enum

```typescript
enum ProductStatus {
  UNSPECIFIED = 'UNSPECIFIED',
  PRE_ORDER = 'PRE_ORDER',
  NOT_YET_OPEN = 'NOT_YET_OPEN',
  OPEN_FOR_SALE = 'OPEN_FOR_SALE',
  SOLD_OUT = 'SOLD_OUT',
  CLOSED = 'CLOSED',
  DELETED = 'DELETED',
}
```

### FarmStatus Enum

```typescript
enum FarmStatus {
  UNSPECIFIED = 'UNSPECIFIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED',
}
```

### CreateProductDto

```typescript
{
  product_name: string;
  description?: string;
  price_per_unit: number;
  unit: string;
  stock_quantity: number;
  weight: number; // in grams
  status: ProductStatus;
  subcategory_ids?: number[];
}
```

### SearchProductsDto

Extends PaginationQueryDto with additional filters:

```typescript
{
  search?: string;
  category?: number;
  subcategory?: number;
  minPrice?: number;
  maxPrice?: number;
  farmId?: string;
  status?: ProductStatus;
  // + pagination fields
}
```

### RegisterFarmDto

```typescript
{
  farm_name: string;
  description?: string;
  email: string;
  phone: string; // Vietnamese phone number format
  tax_number?: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  coordinate: string; // "latitude,longitude"
}
```

## Authentication & Authorization

- **Authentication**: Required for all endpoints except public product browsing
- **Role-based Access**:
  - **CUSTOMER**: Can browse products and farms
  - **FARMER**: Can manage their own products and farm
  - **ADMIN**: Full access including category management and farm approval

## File Upload Guidelines

- **Supported Formats**:
  - Images: JPEG, JPG, PNG, GIF, WebP
  - Videos: MP4, WebM
  - Documents: PDF
- **Size Limits**:
  - Images: 10MB per file
  - Videos: 50MB per file
- **File Naming**: Automatic UUID-based naming to prevent conflicts

## Error Handling

All endpoints return standardized error responses:

```typescript
{
  statusCode: number;
  message: string;
  error?: string;
}
```

Common error codes:

- `400`: Bad Request (validation errors, invalid data)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Pagination Response Format

```typescript
{
  statusCode: 200;
  message: string;
  data: {
    data: T[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    }
  }
}
```

## Example Usage

### Create a Product (Farmer)

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "product_name=Organic Tomatoes" \
  -F "description=Fresh organic tomatoes" \
  -F "price_per_unit=25000" \
  -F "unit=kg" \
  -F "stock_quantity=100" \
  -F "weight=1000" \
  -F "status=OPEN_FOR_SALE" \
  -F "subcategory_ids[]=1" \
  -F "product_images=@tomato1.jpg" \
  -F "product_images=@tomato2.jpg"
```

### Search Products

```bash
curl "http://localhost:3000/products?search=tomato&category=1&page=1&limit=10&sort_by=price&order=asc"
```

### Register Farm

```bash
curl -X POST http://localhost:3000/products/farms/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "farm_name=Green Valley Farm" \
  -F "email=farm@greenvalley.com" \
  -F "phone=+84987654321" \
  -F "city=Ho Chi Minh City" \
  -F "district=District 1" \
  -F "ward=Ward 1" \
  -F "street=123 Nguyen Hue Street" \
  -F "coordinate=10.762622,106.660172" \
  -F "cccd=@id_card_front.jpg" \
  -F "biometric_video=@verification.mp4"
```

## Integration Notes

- The module uses gRPC for communication with the Products microservice
- All file uploads are handled through the configured storage strategy
- Automatic user context injection via JWT authentication
- Comprehensive logging for debugging and monitoring
- TypeScript types ensure compile-time safety
- Swagger documentation auto-generated from decorators
