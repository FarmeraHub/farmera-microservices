# Users Service - gRPC Implementation

This document describes the gRPC implementation for the Farmera Users Service.

## 🚀 Overview

The Users Service now supports both REST API and gRPC protocols, providing:

- **Authentication**: Login, logout, password management
- **User Management**: CRUD operations for users
- **Profile Management**: User profiles with locations and payment methods
- **Email Verification**: Email verification workflows
- **Admin Functions**: User statistics and role-based operations

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Protocol Buffers compiler (protoc)
- gRPC dependencies installed

## 🛠️ Installation

1. **Install Dependencies**:

```bash
npm install @nestjs/microservices @grpc/grpc-js @grpc/proto-loader
```

2. **Generate Proto Files** (if needed):

```bash
# From project root
buf generate
```

## 🏃‍♂️ Running the Service

### Option 1: gRPC Only

```bash
npm run start:grpc:dev
```

- Runs only the gRPC server on `localhost:50051`

### Option 2: Hybrid Mode (Recommended)

```bash
npm run start:hybrid:dev
```

- Runs both REST API (port 3002) and gRPC (port 50051)
- Includes Swagger documentation at `http://localhost:3002/api`

### Option 3: Production

```bash
npm run build
npm run start:grpc
# or
npm run start:hybrid
```

## 📡 gRPC Service Definition

### Service: `farmera.users.UsersService`

**Port**: `50051`
**Package**: `farmera.users`

### Available Methods

#### Authentication

- `Login(LoginRequest) → LoginResponse`
- `RefreshToken(RefreshTokenRequest) → RefreshTokenResponse`
- `Logout(LogoutRequest) → LogoutResponse`
- `ForgotPassword(ForgotPasswordRequest) → ForgotPasswordResponse`
- `UpdatePassword(UpdatePasswordRequest) → UpdatePasswordResponse`

#### User Management

- `CreateUser(CreateUserRequest) → CreateUserResponse`
- `GetUser(GetUserRequest) → GetUserResponse`
- `UpdateUser(UpdateUserRequest) → UpdateUserResponse`
- `DeleteUser(DeleteUserRequest) → DeleteUserResponse`
- `ListUsers(ListUsersRequest) → ListUsersResponse`

#### Profile Management

- `GetUserProfile(GetUserProfileRequest) → GetUserProfileResponse`
- `UpdateUserProfile(UpdateUserProfileRequest) → UpdateUserProfileResponse`

#### Email Verification

- `SendVerificationEmail(SendVerificationEmailRequest) → SendVerificationEmailResponse`
- `VerifyEmail(VerifyEmailRequest) → VerifyEmailResponse`

#### Location & Payment Methods

- `AddUserLocation(AddUserLocationRequest) → AddUserLocationResponse`
- `AddPaymentMethod(AddPaymentMethodRequest) → AddPaymentMethodResponse`

#### Admin Functions

- `GetUsersByRole(GetUsersByRoleRequest) → GetUsersByRoleResponse`
- `UpdateUserStatus(UpdateUserStatusRequest) → UpdateUserStatusResponse`
- `GetUserStats(GetUserStatsRequest) → GetUserStatsResponse`

## 🧪 Testing

### Using the Test Client

```bash
node test-grpc-client.js
```

### Manual Testing with grpcurl

```bash
# List services
grpcurl -plaintext localhost:50051 list

# List methods
grpcurl -plaintext localhost:50051 list farmera.users.UsersService

# Test SendVerificationEmail
grpcurl -plaintext -d '{"email": "test@example.com"}' \
  localhost:50051 farmera.users.UsersService/SendVerificationEmail

# Test ListUsers
grpcurl -plaintext -d '{"pagination": {"page": 1, "limit": 10}}' \
  localhost:50051 farmera.users.UsersService/ListUsers
```

## 🏗️ Architecture

### File Structure

```
src/
├── grpc/
│   ├── dto/
│   │   └── grpc-request.dto.ts     # gRPC request/response DTOs
│   ├── mappers/
│   │   └── user.mapper.ts          # Entity to gRPC message mapping
│   ├── grpc.module.ts              # gRPC module configuration
│   └── users-grpc.controller.ts    # gRPC method implementations
├── grpc-main.ts                    # gRPC-only entry point
├── hybrid-main.ts                  # Hybrid REST+gRPC entry point
└── app.module.ts                   # Main application module
```

### Key Components

#### 1. GrpcModule (`src/grpc/grpc.module.ts`)

- Configures gRPC client and server
- Imports necessary services (Users, Auth)
- Registers the gRPC controller

#### 2. UsersGrpcController (`src/grpc/users-grpc.controller.ts`)

- Implements all gRPC service methods
- Handles request/response mapping
- Provides proper error handling with gRPC status codes

#### 3. UserMapper (`src/grpc/mappers/user.mapper.ts`)

- Converts TypeORM entities to gRPC messages
- Handles timestamp conversions
- Maps enums between database and protobuf formats

## 🔧 Configuration

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=farmera_users

# Email (for verification)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@farmera.com
```

### gRPC Server Options

```typescript
{
  transport: Transport.GRPC,
  options: {
    package: 'farmera.users',
    protoPath: join(__dirname, '../grpc-protos/users/users.proto'),
    url: 'localhost:50051',
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  },
}
```

## 🔒 Security Considerations

1. **Authentication**: gRPC methods should validate JWT tokens
2. **Authorization**: Role-based access control for admin methods
3. **Input Validation**: All inputs are validated using class-validator
4. **Error Handling**: Proper gRPC status codes and error messages

## 📊 Monitoring & Logging

- All gRPC methods include structured logging
- Request/response logging with user context
- Error tracking with stack traces
- Performance metrics can be added using interceptors

## 🚀 Next Steps

1. **Database Integration**: Connect to actual PostgreSQL database
2. **Authentication**: Implement JWT token validation
3. **Error Handling**: Add comprehensive error handling
4. **Testing**: Add unit and integration tests
5. **Monitoring**: Add metrics and health checks
6. **Documentation**: Generate API documentation from proto files

## 🤝 Integration with Other Services

This gRPC service can be consumed by:

- **API Gateway**: Route gRPC calls from external clients
- **Other Microservices**: Direct service-to-service communication
- **Frontend Applications**: Using gRPC-Web
- **Mobile Apps**: Native gRPC clients

## 📚 Resources

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [gRPC Node.js](https://grpc.io/docs/languages/node/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)
- [Buf CLI](https://buf.build/docs/)
