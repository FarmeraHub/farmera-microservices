# Farmera Microservices gRPC Implementation Guide

## 🚀 Quick Start

This guide will help you implement the gRPC services for your Farmera microservices ecosystem.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v18+) for TypeScript/JavaScript services
- **Rust** (latest stable) for Rust services
- **Protocol Buffers Compiler** (`protoc`)
- **Buf CLI** for proto management
- **Docker** (optional, for containerized services)

## 📁 Project Structure

```
farmera-microservices/
├── grpc-protos/                 # Proto definitions (shared)
│   ├── common/                  # Shared types and enums
│   ├── users/                   # Users service protos
│   ├── products/                # Products service protos
│   ├── payment/                 # Payment service protos
│   ├── notification/            # Notification service protos
│   ├── communication/           # Communication service protos
│   ├── buf.yaml                 # Buf configuration
│   └── setup.sh                 # Setup script
├── generated/                   # Generated gRPC code
│   ├── nodejs/                  # TypeScript/JavaScript generated code
│   └── rust/                    # Rust generated code
├── users-service/               # Users microservice (Node.js)
├── products-service/            # Products microservice (Node.js)
├── payment-service/             # Payment microservice (Node.js)
├── notification-service/        # Notification microservice (Rust)
└── communication-service/       # Communication microservice (Rust)
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

**Install Buf CLI:**

```bash
# macOS
brew install bufbuild/buf/buf

# Linux
sudo apt update && sudo apt install -y protobuf-compiler
curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-$(uname -s)-$(uname -m)" -o "/usr/local/bin/buf"
chmod +x "/usr/local/bin/buf"

# Windows
winget install bufbuild.buf
```

**Install Protocol Buffers:**

```bash
# macOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install -y protobuf-compiler

# Windows
winget install protobuf
```

### 2. Generate gRPC Code

```bash
cd grpc-protos
./setup.sh  # This will generate code for all services
```

## 🏗️ Service Implementation Strategy

### Phase 1: Foundation Services (Week 1-2)

#### Users Service (Node.js/NestJS)

**Priority**: CRITICAL - All other services depend on this

**Implementation Steps:**

1. Set up NestJS gRPC server
2. Implement authentication methods (login, refresh token)
3. Implement user CRUD operations
4. Add email verification
5. Set up JWT token management

**Key Files to Create:**

```
users-service/
├── src/
│   ├── grpc/
│   │   ├── users.controller.ts      # gRPC controller
│   │   └── users.service.ts         # Business logic
│   ├── auth/
│   │   ├── auth.service.ts          # Authentication logic
│   │   └── jwt.strategy.ts          # JWT strategy
│   ├── entities/
│   │   └── user.entity.ts           # User entity
│   └── main.ts                      # gRPC server setup
└── proto-generated/                 # Symlink to generated code
```

**Example Implementation:**

```typescript
// users-service/src/main.ts
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "farmera.users",
      protoPath: join(__dirname, "../proto/users/users.proto"),
      url: "localhost:50051",
    },
  });

  await app.listen();
  console.log("Users Service listening on port 50051");
}
bootstrap();
```

```typescript
// users-service/src/grpc/users.controller.ts
import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import {
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  CreateUserResponse,
} from "../../generated/nodejs/users";

@Controller()
export class UsersController {
  @GrpcMethod("UsersService", "Login")
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Implement login logic
    return {
      user: {
        /* user data */
      },
      tokenInfo: {
        /* token data */
      },
      requiresVerification: false,
      verificationType: "",
    };
  }

  @GrpcMethod("UsersService", "CreateUser")
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    // Implement user creation logic
    return {
      user: {
        /* created user */
      },
      verificationSent: true,
    };
  }
}
```

### Phase 2: Product Management (Week 3-4)

#### Products Service (Node.js/NestJS)

**Dependencies**: Users Service

**Implementation Steps:**

1. Set up gRPC server with NestJS
2. Implement product CRUD operations
3. Add farm management
4. Implement category management
5. Add review system
6. Set up process tracking and biometrics

### Phase 3: Business Logic (Week 5-6)

#### Payment Service (Node.js/NestJS)

**Dependencies**: Users Service, Products Service

**Implementation Steps:**

1. Set up order management
2. Implement payment processing with Stripe/PayPal
3. Add discount and coupon system
4. Implement delivery tracking
5. Add analytics and reporting

### Phase 4: Communication Services (Week 7-8)

#### Notification Service (Rust)

**Implementation Steps:**

1. Set up Tonic gRPC server
2. Implement notification creation and delivery
3. Add template management
4. Integrate with FCM, email providers
5. Add user preferences and device management

**Example Rust Implementation:**

```rust
// notification-service/src/main.rs
use tonic::{transport::Server, Request, Response, Status};
use farmera_grpc_proto::notification::{
    notification_service_server::{NotificationService, NotificationServiceServer},
    SendNotificationRequest,
    SendNotificationResponse,
};

#[derive(Debug, Default)]
pub struct NotificationServiceImpl {}

#[tonic::async_trait]
impl NotificationService for NotificationServiceImpl {
    async fn send_notification(
        &self,
        request: Request<SendNotificationRequest>,
    ) -> Result<Response<SendNotificationResponse>, Status> {
        let req = request.into_inner();

        // Implement notification sending logic
        let response = SendNotificationResponse {
            success: true,
            notification: None,
            failed_channels: vec![],
            delivery_ids: std::collections::HashMap::new(),
        };

        Ok(Response::new(response))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::1]:50054".parse()?;
    let notification_service = NotificationServiceImpl::default();

    Server::builder()
        .add_service(NotificationServiceServer::new(notification_service))
        .serve(addr)
        .await?;

    Ok(())
}
```

#### Communication Service (Rust)

**Dependencies**: Users Service

**Implementation Steps:**

1. Set up Tonic gRPC server with streaming
2. Implement conversation management
3. Add real-time messaging with WebSocket bridges
4. Implement file attachment handling
5. Add user presence and typing indicators

## 🔧 Development Workflow

### 1. Proto-First Development

Always update `.proto` files first, then regenerate code:

```bash
# After modifying proto files
cd grpc-protos
./regenerate.sh
```

### 2. Testing Strategy

```bash
# Unit tests for business logic
npm test  # Node.js services
cargo test  # Rust services

# Integration tests with TestContainers
npm run test:integration

# gRPC client testing with grpcurl
grpcurl -plaintext localhost:50051 farmera.users.UsersService/Login
```

### 3. Service Discovery

Implement service discovery with:

- **Development**: Direct service addresses
- **Production**: Kubernetes service discovery or Consul

### 4. Authentication Flow

```
Client → API Gateway → Users Service (auth) → Target Service
```

1. Client sends JWT token to API Gateway
2. Gateway validates token with Users Service
3. Gateway forwards authenticated request to target service
4. Services trust the gateway's user context

## 📊 Monitoring and Observability

### 1. Metrics Collection

Implement metrics for:

- Request latency
- Success/error rates
- Service health
- Business metrics

### 2. Distributed Tracing

Use OpenTelemetry for tracing requests across services:

```typescript
// Add to each service
import { NodeSDK } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  serviceName: "users-service",
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### 3. Logging

Structured logging with correlation IDs:

```typescript
// Shared logging setup
import { Logger } from "@nestjs/common";

export class ServiceLogger extends Logger {
  log(message: string, context?: string, correlationId?: string) {
    super.log(`[${correlationId}] ${message}`, context);
  }
}
```

## 🚀 Deployment Strategy

### 1. Containerization

```dockerfile
# Dockerfile for Node.js services
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 50051
CMD ["npm", "start"]
```

### 2. Kubernetes Deployment

```yaml
# k8s/users-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: users-service
  template:
    metadata:
      labels:
        app: users-service
    spec:
      containers:
        - name: users-service
          image: farmera/users-service:latest
          ports:
            - containerPort: 50051
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secrets
                  key: url
---
apiVersion: v1
kind: Service
metadata:
  name: users-service
spec:
  selector:
    app: users-service
  ports:
    - port: 50051
      targetPort: 50051
  type: ClusterIP
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Services
on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate Proto Code
        run: |
          cd grpc-protos
          ./setup.sh

      - name: Run Tests
        run: |
          npm test
          cargo test

      - name: Build and Deploy
        run: |
          docker build -t farmera/users-service ./users-service
          kubectl apply -f k8s/
```

## 🔄 Inter-Service Communication Examples

### 1. Users Service → Notification Service

```typescript
// When user registers, send welcome notification
async createUser(userData) {
  const user = await this.userRepository.save(userData);

  // Send welcome notification
  await this.notificationClient.sendNotification({
    userId: user.id,
    type: NotificationType.NOTIFICATION_TYPE_SYSTEM_ALERT,
    title: "Welcome to Farmera!",
    message: "Your account has been created successfully.",
    channels: [NotificationChannel.NOTIFICATION_CHANNEL_EMAIL]
  });

  return user;
}
```

### 2. Payment Service → Products Service

```typescript
// When order is created, check product availability
async createOrder(orderData) {
  // Validate product availability
  for (const item of orderData.items) {
    const product = await this.productsClient.getProduct({
      productId: item.productId,
      includeInventory: true
    });

    if (product.inventory.availableQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.productName}`);
    }
  }

  return this.processOrder(orderData);
}
```

## 📚 Next Steps

1. **Start with Users Service** - Critical foundation
2. **Set up development environment** with proto generation
3. **Implement authentication flow** end-to-end
4. **Add Products Service** with basic CRUD
5. **Build Payment Service** with order management
6. **Add real-time features** with Notification and Communication services
7. **Set up monitoring and deployment** pipeline

## 🆘 Troubleshooting

### Common Issues:

1. **Proto compilation errors**

   ```bash
   buf lint  # Check for syntax errors
   buf breaking --against '.git#branch=main'  # Check breaking changes
   ```

2. **Service discovery issues**

   - Use direct addresses in development
   - Check Kubernetes service names in production

3. **Authentication failures**

   - Verify JWT token format
   - Check service-to-service authentication

4. **Performance issues**
   - Enable gRPC connection pooling
   - Use streaming for large datasets
   - Implement caching layers

Need help? Check the troubleshooting section or create an issue in the repository.

---

Happy coding! 🌾 Let's build an amazing agricultural marketplace platform! 🚀
