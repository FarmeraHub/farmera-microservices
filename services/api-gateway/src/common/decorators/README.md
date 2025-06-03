# 🎯 Common Decorators

This directory contains custom decorators used throughout the API Gateway to enhance functionality and simplify code.

## 📋 Available Decorators

### @Public()

Marks a route as publicly accessible, bypassing JWT authentication.

```typescript
import { Public } from '../common/decorators/public.decorator';

@Public()
@Get('public-endpoint')
publicEndpoint() {
  return 'This endpoint is accessible without authentication';
}
```

### @User()

Extracts the authenticated user from the request object. Can be used to get the entire user object or specific properties.

```typescript
import { User } from '../common/decorators/user.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

// Get the entire user object
@Get('profile')
getProfile(@User() user: UserInterface) {
  return `Hello ${user.first_name} ${user.last_name}!`;
}

// Get a specific user property
@Get('user-id')
getUserId(@User('id') userId: string) {
  return { userId };
}
```

### @ResponseMessage()

Sets a custom message for the standardized API response format.

```typescript
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Post('create')
@ResponseMessage('Item created successfully')
createItem(@Body() createItemDto: CreateItemDto) {
  // This will return:
  // {
  //   "statusCode": 201,
  //   "message": "Item created successfully",
  //   "data": { ... }
  // }
  return this.itemsService.create(createItemDto);
}
```

## 🔧 Creating Custom Decorators

To create a new decorator:

1. Create a new file in this directory with the naming convention `name.decorator.ts`
2. Use NestJS decorator factories as needed
3. Export the decorator function

Example:

```typescript
import { SetMetadata } from '@nestjs/common';

export const CUSTOM_KEY = 'custom_metadata';
export const CustomDecorator = (value: string) =>
  SetMetadata(CUSTOM_KEY, value);
```
