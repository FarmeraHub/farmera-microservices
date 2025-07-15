# 🌾 Farmera Microservices Platform

A comprehensive microservices architecture for agricultural technology platform, handling everything from user management to real-time communication, payments, and IoT device integration.

## 🏗️ Architecture Overview

### **Services Architecture**

```
API Gateway (Port 3000) ← Primary Entry Point
├── Authentication Module (JWT, OAuth, etc.)
├── Request Routing & Load Balancing
├── Rate Limiting & Security
└── Service Health Monitoring

Microservices:
├── Users Service (Port 3001 | gRPC 50051)
├── Products Service (Port 3002 | gRPC 50052)
├── Payment Service (Port 3003 | gRPC 50053)
├── Notification Service (Port 3004 | gRPC 50054) - Rust
└── Communication Service (Port 3005 | gRPC 50055) - Rust
```

## 📁 **Project Structure**

```
farmera-microservices/
├── services/                 # All microservices
│   ├── api-gateway/         # Central API Gateway & authentication (Node.js/NestJS)
│   ├── users-service/       # User management & authentication (Node.js/NestJS)
│   ├── products-service/    # Product catalog & farm management (Node.js/NestJS)
│   ├── payment-service/     # Orders, payments & delivery (Node.js/NestJS)
│   ├── notification-service/ # Push notifications & email (Rust/Actix-web)
│   └── communication-service/ # Real-time messaging & WebSockets (Rust/Actix-web)
├── shared/                  # Shared resources
│   ├── grpc-protos/        # gRPC protocol definitions
│   └── generated/          # Generated gRPC code
├── docs/                   # Documentation
├── tools/                  # Development tools & scripts
└── infrastructure/         # Docker Compose, K8s configs (coming soon)
```

## 🚀 **Services Overview**

### **API Gateway** (Node.js/NestJS)

- 🌐 Central entry point for all microservices
- 🔐 Centralized JWT authentication & authorization
- 🔄 Intelligent request routing & load balancing
- 📊 Health monitoring & service discovery
- ⚡ Rate limiting & security middleware
- 📚 Unified API documentation (Swagger)
- 🛡️ CORS, Helmet, and input validation

### **Users Service** (Node.js/NestJS)

- 👤 User authentication & profile management
- 🔐 JWT token management
- 📧 Email verification
- 📍 Location management
- 💳 Payment method storage

### **Products Service** (Node.js/NestJS)

- 📦 Product catalog management
- 🚜 Farm & agricultural equipment
- ☁️ Azure blob storage integration
- 🔗 Blockchain integration
- 🔬 Biometric authentication

### **Payment Service** (Node.js/NestJS)

- 💰 Order processing & management
- 💳 Payment gateway integration
- 🎟️ Discount & coupon system
- 🚚 Delivery management
- 📊 Payment analytics

### **Notification Service** (Rust/Actix-web)

- FCM push notifications
- SendGrid email service

### **Communication Service** (Rust/Actix-web)

- Real-time messaging
- WebSocket connections

## 🛠️ **Technology Stack**

### **Backend Frameworks**

- **Node.js Services**: NestJS, TypeORM
- **Rust Services**: Actix-web, Sqlx, Tokio

### **Databases & Storage**

- **PostgreSQL**: Primary database for all services
- **Azure Blob Storage**: File storage

### **Communication**

- **gRPC**: Inter-service communication
- **REST APIs**: External client communication
- **WebSockets**: Real-time messaging

### **Development Tools**

- **Docker**: Containerization
- **Docker Compose**: Local development
- **Buf**: Protocol buffer management

## 🚀 **Quick Start**

### **Prerequisites**

```bash
# Required tools
- Node.js 18+
- Rust 1.70+
- Docker & Docker Compose
- PostgreSQL 14+
```

### **1. Clone & Setup**

```bash
git clone https://github.com/FarmeraHub/farmera-microservices.git
cd farmera-microservices

# Install global dependencies
npm install -g @nestjs/cli
```

### **2. Setup gRPC (First Time)**

```bash
./tools/setup.sh
```

### **3. Start Services**

```bash
# Start API Gateway (recommended entry point)
cd services/api-gateway && npm run start:dev

# Start each service (in separate terminals)
cd services/users-service && npm run start:dev
cd services/products-service && npm run start:dev
cd services/payment-service && npm run start:dev
cd services/communication-service && docker compose up --build
cd services/notification-service && docker compose up --build
```

## 📡 **Service Communication**

### **🌐 API Gateway (Primary Entry Point)**

- **API Gateway**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3000/api/docs`
- **Health Monitoring**: `http://localhost:3000/api/health`

**All microservices accessible through gateway:**

- `POST /api/users/auth/login` → Users Service
- `GET /api/products/categories` → Products Service
- `POST /api/payment/orders` → Payment Service
- `GET /api/notification/status` → Notification Service
- `POST /api/communication/messages` → Communication Service

### **gRPC Endpoints (Internal Communication)**

- **Users Service**: `localhost:50051`
- **Products Service**: `localhost:50052`
- **Payment Service**: `localhost:50053`
- **Notification Service**: `localhost:50054`
- **Communication Service**: `localhost:50055`

### **Direct REST APIs (Development Only)**

- **API Gateway**: `http://localhost:3000` ⭐ **Primary Entry Point**
- **Users Service**: `http://localhost:3001`
- **Products Service**: `http://localhost:3002`
- **Payment Service**: `http://localhost:3003`
- **Notification Service**: `http://localhost:3004`
- **Communication Service**: `http://localhost:3005`

## 🔐 **Security**

- **JWT Authentication**: All services use JWT tokens
- **Input Validation**: DTOs with class-validator
- **SQL Injection Protection**: TypeORM/Diesel query builders
- **Rate Limiting**: Configured per service
- **CORS**: Properly configured for web clients

## 📝 **Documentation**

- [gRPC Setup Guide](docs/GRPC_DEVELOPMENT_GUIDE.md)

## 🐛 **Troubleshooting**

### **Common Issues**

1. **gRPC Connection Errors**: Ensure all services are running on correct ports
2. **Database Connection**: Check PostgreSQL is running and connections are correct
3. **Port Conflicts**: Each service uses different ports (3001-3005, 50051-50055)

### **Getting Help**

- Create an issue in the repository
- Check existing documentation in `docs/`
- Review service-specific README files

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.