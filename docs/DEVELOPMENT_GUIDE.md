# 🛠️ Farmera Microservices Development Guide

This guide will help you set up and develop the Farmera microservices platform locally.

## 📋 Prerequisites

### Required Software

- **Node.js 18+** - For Node.js services
- **Rust 1.70+** - For Rust services
- **Docker Desktop** - For infrastructure services
- **Git** - Version control
- **VS Code** (recommended) - IDE with extensions

### Recommended VS Code Extensions

- **Rust Analyzer** - Rust language support
- **TypeScript and JavaScript Language Features** - Built-in
- **Docker** - Container management
- **GitLens** - Git integration
- **Thunder Client** - API testing
- **Protobuf** - Protocol buffer support

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd farmera-microservices

# Install monorepo dependencies
npm install

# Install service dependencies
npm run install:services
```

### 2. Start Infrastructure

```bash
# Start Docker Desktop first, then:
./tools/start-dev.ps1  # Windows
# or
./tools/start-dev.sh   # Linux/macOS (coming soon)
```

### 3. Start Services

```bash
# Option 1: Start all services at once
npm run start:all

# Option 2: Start services individually (recommended for development)
# Terminal 1
cd services/users-service && npm run start:dev

# Terminal 2
cd services/products-service && npm run start:dev

# Terminal 3
cd services/payment-service && npm run start:dev

# Terminal 4
cd services/notification-service && cargo run

# Terminal 5
cd services/communication-service && cargo run
```

### 4. Verify Setup

```bash
npm run health:check
```

## 🏗️ Project Structure

```
farmera-microservices/
├── services/                    # All microservices
│   ├── users-service/          # User management (NestJS)
│   ├── products-service/       # Product catalog (NestJS)
│   ├── payment-service/        # Payments & orders (NestJS)
│   ├── notification-service/   # Notifications (Rust)
│   └── communication-service/  # Real-time messaging (Rust)
├── shared/                     # Shared resources
│   ├── grpc-protos/           # Protocol buffer definitions
│   └── generated/             # Generated gRPC code
├── docs/                      # Documentation
├── tools/                     # Development scripts
├── infrastructure/            # Docker configs
├── docker-compose.yml         # Local infrastructure
├── package.json              # Monorepo configuration
└── README.md                 # Main documentation
```

## 🔧 Development Workflow

### Adding New Features

1. **Update Proto Files** (if needed)

   ```bash
   # Edit files in shared/grpc-protos/
   # Then regenerate code:
   npm run grpc:generate
   ```

2. **Implement Service Logic**

   - Node.js services: Add controllers, services, DTOs
   - Rust services: Add handlers, models, services

3. **Test Changes**

   ```bash
   # Run tests for specific service
   cd services/users-service && npm test
   cd services/notification-service && cargo test

   # Run all tests
   npm run test:all
   ```

4. **Verify Integration**
   ```bash
   npm run health:check
   ```

### Database Management

#### Node.js Services (TypeORM)

```bash
# Generate migration
cd services/users-service
npm run migration:generate -- src/migrations/AddNewField

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

#### Rust Services (Diesel)

```bash
# Generate migration
cd services/notification-service
diesel migration generate add_new_field

# Run migrations
diesel migration run

# Revert migration
diesel migration revert
```

### Code Quality

#### Linting and Formatting

```bash
# Lint all Node.js services
npm run lint:all

# Format all code
npm run format:all

# Fix linting issues
npm run lint:all -- --fix
```

#### Testing

```bash
# Run all tests
npm run test:all

# Run specific service tests
npm test --prefix services/users-service

# Run with coverage
npm run test:all -- --coverage
```

## 🐳 Docker Development

### Infrastructure Services

```bash
# Start all infrastructure
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Reset all data
docker-compose down -v
```

### Service Management UIs

- **pgAdmin**: http://localhost:5050
  - Email: `admin@farmera.com`
  - Password: `farmera_admin_2024`
- **Redis Commander**: http://localhost:8081
- **Kafka UI**: http://localhost:8082

## 🔗 Service Communication

### REST API Endpoints

- **Users**: http://localhost:3001
- **Products**: http://localhost:3002
- **Payment**: http://localhost:3003
- **Notification**: http://localhost:3004
- **Communication**: http://localhost:3005

### gRPC Endpoints

- **Users**: localhost:50051
- **Products**: localhost:50052
- **Payment**: localhost:50053
- **Notification**: localhost:50054
- **Communication**: localhost:50055

### Testing APIs

#### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Import collection from `docs/api/thunder-client/`
3. Test endpoints directly in VS Code

#### Using curl

```bash
# Health check
curl http://localhost:3001/health

# User registration
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🐛 Debugging

### Node.js Services

```bash
# Start in debug mode
cd services/users-service
npm run start:debug

# Attach debugger in VS Code (port 9229)
```

### Rust Services

```bash
# Build with debug symbols
cd services/notification-service
cargo build

# Run with debug logging
RUST_LOG=debug cargo run
```

### Common Issues

#### Port Conflicts

```bash
# Check what's using a port
netstat -ano | findstr :3001  # Windows
lsof -i :3001                 # macOS/Linux

# Kill process using port
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down postgres
docker volume rm farmera-microservices_postgres_data
docker-compose up -d postgres
```

#### gRPC Issues

```bash
# Regenerate proto files
npm run grpc:generate

# Check if gRPC server is running
telnet localhost 50051
```

## 📊 Monitoring

### Logs

```bash
# View service logs
docker-compose logs -f <service-name>

# View all logs
docker-compose logs -f

# Node.js service logs
cd services/users-service && npm run start:dev

# Rust service logs with debug
cd services/notification-service && RUST_LOG=debug cargo run
```

### Health Checks

```bash
# Check all services
npm run health:check

# Check specific service
curl http://localhost:3001/health
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Commit Convention

```bash
# Format: type(scope): description
git commit -m "feat(users): add email verification"
git commit -m "fix(payment): resolve order calculation bug"
git commit -m "docs: update API documentation"
```

### Pre-commit Hooks (Recommended)

```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint:all && npm run test:all"
```

## 🚀 Deployment

### Environment Variables

Each service requires specific environment variables. Check individual service README files for details.

### Production Build

```bash
# Build all services
npm run build:all

# Build specific service
npm run build --prefix services/users-service
cd services/notification-service && cargo build --release
```

## 📚 Additional Resources

- [gRPC Setup Guide](GRPC_SETUP_COMPLETE.md)
- [API Documentation](api/) (coming soon)
- [Architecture Decisions](adr/) (coming soon)
- [Deployment Guide](deployment/) (coming soon)

## 🆘 Getting Help

1. Check this documentation
2. Review service-specific README files
3. Check existing issues in the repository
4. Create a new issue with detailed description

---

**Happy coding! 🌱**
