# 🌐 Farmera API Gateway

Central entry point for all Farmera microservices, providing unified authentication, routing, and monitoring.

## 🚀 Features

- **🔐 Centralized Authentication** - JWT-based authentication for all services
- **🔄 Intelligent Routing** - Dynamic routing to microservices
- **📊 Health Monitoring** - Comprehensive health checks for all services
- **⚡ Rate Limiting** - Built-in throttling and security
- **📚 API Documentation** - Auto-generated Swagger documentation
- **🛡️ Security** - Helmet, CORS, and input validation
- **🔍 Request Logging** - Detailed request/response logging
- **🔌 gRPC Integration** - Direct communication with microservices via gRPC
- **🔄 Standardized Responses** - Consistent API response format

## 📁 Project Structure

```
src/
├── auth/                   # Authentication module and controllers
├── common/
│   ├── decorators/         # Custom decorators (Public, User, ResponseMessage)
│   ├── interceptors/       # Response transformers and interceptors
│   └── interfaces/         # Common interfaces (User, etc.)
├── guards/                 # Authentication guards
├── health/                 # Health check endpoints
├── proxy/                  # Service routing and proxying
├── services/               # gRPC client services
├── app.module.ts           # Main application module
├── app.controller.ts       # Basic app endpoints
├── app.service.ts          # App service
└── main.ts                 # Application entry point
```

## 🛠️ Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret_here
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Microservices URLs
USERS_SERVICE_URL=http://localhost:3001
PRODUCTS_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
COMMUNICATION_SERVICE_URL=http://localhost:3005

# gRPC Services
USERS_GRPC_URL=localhost:50051
PRODUCTS_GRPC_URL=localhost:50052
PAYMENT_GRPC_URL=localhost:50053

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running microservices (users, products, payment, etc.)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Start in development mode
npm run start:dev

# Start in debug mode
npm run start:debug

# Build for production
npm run build

# Start production
npm run start:prod
```

## 📡 API Endpoints

### Health Checks

- `GET /api/health` - Overall system health
- `GET /api/health/detailed` - Detailed health with metrics
- `GET /api/services/health/:service` - Individual service health
- `GET /api/services` - List all registered services

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/send-verification-email` - Send verification email
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/update-new-password` - Update password with reset code
- `POST /api/auth/logout` - User logout

### Service Routing

All microservice endpoints are accessible through:

```
/api/:service/*
```

Examples:

- `POST /api/users/auth/login` → `users-service/auth/login`
- `GET /api/products/categories` → `products-service/categories`
- `POST /api/payment/orders` → `payment-service/orders`

### Authentication

The gateway handles JWT authentication automatically:

- **Public endpoints** - Use `@Public()` decorator
- **Protected endpoints** - Require valid JWT token in Authorization header
- **Token validation** - Automatic JWT verification and user context injection
- **User extraction** - Use `@User()` decorator to access the authenticated user

## 🔐 Authentication Flow

1. **Login Request** → Processed by API Gateway via gRPC to users-service
2. **JWT Generation** → Handled by users-service, returned via Gateway
3. **Token Validation** → Gateway validates on subsequent requests
4. **User Context** → Injected into request for downstream services
5. **Refresh Flow** → Automatic token refresh using refresh tokens

### Using the User Decorator

```typescript
import { User } from '../common/decorators/user.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

@Get('profile')
async getUserProfile(@User() user: UserInterface) {
  // Access user properties: user.id, user.email, etc.
  return await this.userService.getProfile(user.id);
}

// Get specific properties
@Get('user-id')
async getUserId(@User('id') userId: string) {
  return { userId };
}
```

## 🏗️ Architecture

```
Client Request
     ↓
API Gateway (Port 3000)
     ↓
┌─────────────────────────────────────┐
│  JWT Authentication & Validation   │
├─────────────────────────────────────┤
│  Rate Limiting & Security          │
├─────────────────────────────────────┤
│  Request Routing & Proxying        │
└─────────────────────────────────────┘
     ↓
┌─────────────────────┐  ┌─────────────────────┐
│  HTTP REST APIs     │  │  gRPC Services      │
└─────────────────────┘  └─────────────────────┘
     ↓                         ↓
Microservices
├── Users Service (3001/50051)
├── Products Service (3002/50052)
├── Payment Service (3003/50053)
├── Notification Service (3004)
└── Communication Service (3005)
```

## 📊 Monitoring

### Health Endpoints

- **System Health**: `GET /api/health`

  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "services": [...],
    "summary": {
      "total": 5,
      "healthy": 5,
      "unhealthy": 0
    }
  }
  ```

- **Detailed Health**: `GET /api/health/detailed`
  - Includes gateway metrics (uptime, memory usage)
  - Individual service status
  - Performance metrics

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **JWT Validation** - Token-based authentication
- **Input Validation** - Request payload validation
- **Request Sanitization** - XSS and injection protection

## 📚 API Documentation

Interactive API documentation available at:

- **Development**: http://localhost:3000/api/docs
- **Swagger UI** with all endpoints documented
- **Authentication testing** built-in

## 🔄 Standardized Response Format

All API responses follow a consistent format:

```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## 🔧 Development

### Adding New Services

1. Update `proxy.service.ts`:

   ```typescript
   {
     name: 'new-service',
     url: this.configService.get<string>('NEW_SERVICE_URL'),
     healthPath: '/health',
   }
   ```

2. Add environment variable:
   ```bash
   NEW_SERVICE_URL=http://localhost:3006
   ```

### Adding New gRPC Services

1. Create a client service in the `services` directory
2. Register the service in the appropriate module:

   ```typescript
   ClientsModule.register([
     {
       name: 'NEW_GRPC_PACKAGE',
       transport: Transport.GRPC,
       options: {
         url: this.configService.get<string>('NEW_GRPC_URL'),
         package: 'farmera.newservice',
         protoPath: join(__dirname, '../../shared/grpc-protos/newservice/newservice.proto'),
       },
     },
   ]),
   ```

### Custom Middleware

Add middleware in `main.ts`:

```typescript
app.use(yourCustomMiddleware());
```

### Authentication Bypass

Use `@Public()` decorator for endpoints that don't require authentication:

```typescript
@Public()
@Get('public-endpoint')
publicEndpoint() {
  return 'This is public';
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📈 Performance

- **Caching** - Built-in response caching
- **Connection Pooling** - HTTP client optimization
- **Request Compression** - Gzip compression enabled
- **Health Check Caching** - Cached service status

## 🚀 Deployment

### Docker

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

Ensure all microservice URLs are properly configured for your deployment environment.

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure health checks work for new services

## 📝 License

Private - Farmera Team
