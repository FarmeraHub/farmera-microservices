# 🔐 Authentication Module

This module handles all authentication-related functionality for the Farmera API Gateway, serving as the central authentication point for the entire microservices ecosystem.

## 📋 Overview

The authentication module provides:

- User authentication (login/logout)
- User registration
- Email verification
- Password reset flow
- Token refresh mechanism
- User profile access

## 🔌 Integration

The module communicates with the users-service via gRPC for all authentication operations, providing a seamless experience while maintaining service separation.

## 🛣️ Endpoints

| Method | Endpoint                            | Description               | Auth Required |
| ------ | ----------------------------------- | ------------------------- | ------------- |
| POST   | `/api/auth/login`                   | User login                | No            |
| POST   | `/api/auth/register`                | User registration         | No            |
| POST   | `/api/auth/verify-email`            | Verify email with code    | No            |
| POST   | `/api/auth/send-verification-email` | Send verification email   | No            |
| GET    | `/api/auth/profile`                 | Get user profile          | Yes           |
| GET    | `/api/auth/refresh-token`           | Refresh access token      | No            |
| POST   | `/api/auth/forgot-password`         | Request password reset    | No            |
| POST   | `/api/auth/update-new-password`     | Update password with code | No            |
| POST   | `/api/auth/logout`                  | User logout               | No            |

## 🔒 Authentication Flow

1. **Login/Registration**

   - Client sends credentials to API Gateway
   - Gateway forwards request to users-service via gRPC
   - Users-service validates credentials and generates tokens
   - Gateway returns tokens to client (access token + HTTP-only cookie for refresh token)

2. **Token Validation**

   - JwtAuthGuard validates tokens on protected routes
   - Extracts user information and attaches to request
   - @User() decorator provides easy access to user data

3. **Token Refresh**
   - Client requests new token using refresh token
   - Gateway validates refresh token and issues new access token
   - Seamless authentication experience for users

## 🧩 Components

- **auth.controller.ts** - API endpoints for authentication
- **auth.service.ts** - Business logic and gRPC client integration
- **dto/** - Data transfer objects for requests/responses
- **guards/** - JWT authentication guard

## 📝 Usage Examples

### Login

```typescript
// Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "status": "active"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the @User() Decorator

```typescript
import { Controller, Get } from '@nestjs/common';
import { User } from '../common/decorators/user.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

@Controller('example')
export class ExampleController {
  @Get('me')
  getMyInfo(@User() user: UserInterface) {
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
    };
  }

  @Get('role')
  getMyRole(@User('role') role: string) {
    return { role };
  }
}
```

## ⚙️ Configuration

The authentication module uses the following environment variables:

```
JWT_ACCESS_TOKEN_SECRET=your_access_token_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d
USERS_GRPC_URL=localhost:50051
```
