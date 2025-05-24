# 🌾 Farmera Microservices Platform

A comprehensive microservices architecture for agricultural technology platform, handling everything from user management to real-time communication, payments, and IoT device integration.

## 📁 **Project Structure**

```
farmera-microservices/
├── services/                 # All microservices
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

- 📱 FCM push notifications
- 📧 SendGrid email service
- 📊 Kafka event streaming
- 🗄️ PostgreSQL storage
- ⚡ Redis caching

### **Communication Service** (Rust/Actix-web)

- 💬 Real-time messaging
- 🔌 WebSocket connections
- 📎 File attachments
- 🗄️ PostgreSQL storage
- ⚡ Redis pub/sub

## 🛠️ **Technology Stack**

### **Backend Frameworks**

- **Node.js Services**: NestJS, TypeORM, JWT
- **Rust Services**: Actix-web, Diesel ORM, Tokio

### **Databases & Storage**

- **PostgreSQL**: Primary database for all services
- **Redis**: Caching & pub/sub messaging
- **Azure Blob Storage**: File storage

### **Communication**

- **gRPC**: Inter-service communication
- **REST APIs**: External client communication
- **WebSockets**: Real-time messaging
- **Kafka**: Event streaming (notifications)

### **Development Tools**

- **Docker**: Containerization
- **Docker Compose**: Local development
- **Buf**: Protocol buffer management
- **Jest**: Testing framework

## 🚀 **Quick Start**

### **Prerequisites**

```bash
# Required tools
- Node.js 18+
- Rust 1.70+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+
```

### **1. Clone & Setup**

```bash
git clone <repository-url>
cd farmera-microservices

# Install global dependencies
npm install -g @nestjs/cli
cargo install buf
```

### **2. Setup gRPC (First Time)**

```bash
# Run the setup script
./tools/setup.ps1  # Windows
# or
./tools/setup.sh   # Linux/macOS
```

### **3. Start Services**

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Start each service (in separate terminals)
cd services/users-service && npm run start:dev
cd services/products-service && npm run start:dev
cd services/payment-service && npm run start:dev
cd services/notification-service && cargo run
cd services/communication-service && cargo run
```

## 🔧 **Development Workflow**

### **Adding New Features**

1. **Update Proto Files**: Modify `.proto` files in `shared/grpc-protos/`
2. **Regenerate Code**: Run `./tools/setup.ps1` or `buf generate`
3. **Implement Service Logic**: Add handlers in respective services
4. **Test Integration**: Use gRPC clients to test inter-service communication

### **Database Migrations**

```bash
# Node.js services
cd services/users-service
npm run migration:generate -- src/migrations/NewMigration
npm run migration:run

# Rust services
cd services/notification-service
diesel migration generate new_migration
diesel migration run
```

### **Testing**

```bash
# Unit tests for each service
cd services/users-service && npm test
cd services/notification-service && cargo test

# Integration tests
npm run test:e2e
```

## 📡 **Service Communication**

### **gRPC Endpoints**

- **Users Service**: `localhost:50051`
- **Products Service**: `localhost:50052`
- **Payment Service**: `localhost:50053`
- **Notification Service**: `localhost:50054`
- **Communication Service**: `localhost:50055`

### **REST APIs**

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

## 📊 **Monitoring & Observability**

- **Health Checks**: `/health` endpoint on all services
- **Metrics**: Prometheus metrics (coming soon)
- **Logging**: Structured logging with correlation IDs
- **Distributed Tracing**: OpenTelemetry integration (coming soon)

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📝 **Documentation**

- [gRPC Setup Guide](docs/GRPC_SETUP_COMPLETE.md)
- [API Documentation](docs/api/) (coming soon)
- [Deployment Guide](docs/deployment/) (coming soon)
- [Architecture Decision Records](docs/adr/) (coming soon)

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

---

**Made with ❤️ for modern agriculture** 🌱
