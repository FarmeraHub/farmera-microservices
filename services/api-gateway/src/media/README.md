# 📁 Media Module

The Media Module provides centralized file upload, management, and storage capabilities using Azure Blob Storage. It's integrated into the API Gateway to serve all microservices in the Farmera ecosystem.

## 🌟 Features

- **Azure Blob Storage Integration** - Reliable cloud storage with high availability
- **Multiple File Types** - Support for images, videos, and documents
- **Organized Storage** - Automatic categorization by media type
- **File Validation** - Size and type restrictions for security
- **Comprehensive Logging** - Detailed logging for all operations
- **REST API** - Full CRUD operations via RESTful endpoints
- **Swagger Documentation** - Interactive API documentation
- **Authentication** - JWT-based authentication for secure access

## 📂 File Organization

Files are automatically organized into containers based on their `groupType`:

```
Azure Storage Account
├── farmera-user/          # User-related files (avatars, profiles)
├── farmera-product/       # Product images and videos
├── farmera-category/      # Category images
├── farmera-order/         # Order-related documents
└── farmera-general/       # General purpose files
```

## 🔧 Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Azure Blob Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_CONTAINER_PREFIX=farmera
```

### Azure Storage Account Setup

1. **Create Azure Storage Account**:

   ```bash
   az storage account create \
     --name yourstorageaccount \
     --resource-group your-resource-group \
     --location eastus \
     --sku Standard_LRS
   ```

2. **Get Access Keys**:

   ```bash
   az storage account keys list \
     --account-name yourstorageaccount \
     --resource-group your-resource-group
   ```

3. **Configure CORS** (for web uploads):
   ```bash
   az storage cors add \
     --services b \
     --methods GET POST PUT DELETE \
     --origins "*" \
     --allowed-headers "*" \
     --account-name yourstorageaccount
   ```

## 🛠️ Supported File Types

- **Images**: JPEG, JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM
- **Documents**: PDF

**File Size Limit**: 10MB per file

## 📡 API Endpoints

### Upload File

```http
POST /api/media/upload
Content-Type: multipart/form-data
Authorization: Bearer <your-jwt-token>

Form Data:
- file: <binary file>
- groupType: "product" | "user" | "category" | "order" | "general"
- name: <optional custom name>
```

**Response**:

```json
{
  "statusCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "id": "unique-file-id",
    "name": "product-image.jpg",
    "src": "https://yourstorageaccount.blob.core.windows.net/farmera-product/product-image-123456-uuid.jpg",
    "groupType": "product",
    "uploadedBy": {
      "id": "user-id",
      "email": "user@example.com"
    },
    "uploadedAt": "2024-01-01T12:00:00.000Z",
    "contentType": "image/jpeg",
    "size": 2048576
  }
}
```

### List Files

```http
GET /api/media/list/{groupType}?prefix=optional-prefix
Authorization: Bearer <your-jwt-token>
```

### Get File Information

```http
GET /api/media/info?url=<azure-blob-url>
Authorization: Bearer <your-jwt-token>
```

### Delete File

```http
DELETE /api/media/delete?url=<azure-blob-url>
Authorization: Bearer <your-jwt-token>
```

### Health Check

```http
GET /api/media/health
```

## 💻 Usage Examples

### Frontend Upload (JavaScript)

```javascript
// Upload a file
const uploadFile = async (file, groupType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('groupType', groupType);

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return response.json();
};

// Example usage
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const result = await uploadFile(file, 'product');
console.log('Uploaded:', result.data.src);
```

### Backend Integration (NestJS Service)

```typescript
import { Injectable } from '@nestjs/common';
import { MediaService } from '../media/media.service';

@Injectable()
export class ProductService {
  constructor(private mediaService: MediaService) {}

  async updateProductImage(
    productId: string,
    file: Express.Multer.File,
    user: User,
  ) {
    // Upload new image
    const mediaRecord = await this.mediaService.uploadFile(
      file,
      { groupType: MediaType.PRODUCT, name: `product-${productId}` },
      user,
    );

    // Update product with new image URL
    await this.updateProduct(productId, { imageUrl: mediaRecord.src });

    return mediaRecord;
  }
}
```

### cURL Examples

```bash
# Upload a file
curl -X POST "http://localhost:3000/api/media/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "groupType=product"

# List product images
curl -X GET "http://localhost:3000/api/media/list/product" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Delete a file
curl -X DELETE "http://localhost:3000/api/media/delete?url=AZURE_BLOB_URL" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

- **JWT Authentication** - All endpoints (except health check) require valid JWT tokens
- **File Type Validation** - Only allowed file types can be uploaded
- **File Size Limits** - 10MB maximum file size
- **User Context** - All operations are tracked with user information
- **Input Sanitization** - File names and paths are sanitized
- **Azure Security** - Leverages Azure's built-in security features

## 📊 Monitoring and Logging

All media operations are logged with the following information:

- **Upload**: File URL, user, timestamp, file details
- **Delete**: File URL, user, success status
- **Errors**: Detailed error messages and stack traces
- **Health**: Service status and Azure connectivity

Example log entries:

```
[MediaService] Media uploaded successfully: https://storage.blob.core.windows.net/farmera-product/image-123.jpg
[MediaService] Media deleted successfully: https://storage.blob.core.windows.net/farmera-product/old-image.jpg by user: user@example.com
[AzureBlobService] Azure Blob Service initialized successfully
```

## 🔄 Migration from AWS S3

If migrating from AWS S3, you can:

1. **Bulk Transfer**: Use Azure Data Factory or AzCopy to transfer existing files
2. **Update URLs**: Replace S3 URLs with Azure Blob URLs in your database
3. **Gradual Migration**: Run both services in parallel during transition

## 🧪 Testing

### Development Mode

Use the dummy image endpoint for testing:

```http
POST /api/media/dummy-image
Content-Type: application/json

{
  "filePath": "/path/to/local/test-image.jpg",
  "groupType": "general"
}
```

### Unit Tests

```bash
npm run test -- --testPathPattern=media
```

### Integration Tests

```bash
npm run test:e2e -- --testPathPattern=media
```

## 🚀 Production Deployment

### Docker

The media module is included in the API Gateway Docker image:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Variables

Ensure these are set in production:

```bash
AZURE_STORAGE_ACCOUNT_NAME=production_storage_account
AZURE_STORAGE_ACCOUNT_KEY=production_account_key
AZURE_CONTAINER_PREFIX=farmera-prod
NODE_ENV=production
```

## 🔧 Troubleshooting

### Common Issues

1. **Azure Connection Failed**

   - Check storage account name and key
   - Verify network connectivity
   - Ensure storage account exists

2. **File Upload Fails**

   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure JWT token is valid

3. **Container Not Found**
   - Containers are created automatically
   - Check Azure permissions
   - Verify storage account access

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
DEBUG=azure:*
```

## 📚 API Documentation

Interactive documentation is available at:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://your-api-gateway.com/api/docs

The documentation includes:

- Complete endpoint descriptions
- Request/response schemas
- Interactive testing interface
- Authentication examples
