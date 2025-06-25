import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateAddressDto,
  CreateAddressDto,
} from './dto';
import { User } from '../common/decorators/user.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

@ApiTags('User Management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ResponseMessage('User profile retrieved successfully')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            role: { type: 'string' },
            status: { type: 'string' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            total_orders: { type: 'number' },
            total_reviews: { type: 'number' },
            loyalty_points: { type: 'number' },
            member_since: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProfile(@User() user: UserInterface) {
    return await this.userService.getUserProfile(user.id);
  }

  @Put('profile')
  @ResponseMessage('User profile updated successfully')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            gender: { type: 'string' },
            avatar_url: { type: 'string' },
            birthday: { type: 'string', format: 'date-time' },
            bio: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @User() user: UserInterface,
    @Body() req: UpdateProfileDto,
  ) {
    return await this.userService.updateProfile(user.id, req);
  }

  @Put('change-password')
  @ResponseMessage('Password changed successfully')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        requires_relogin: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect or invalid new password',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @User() user: UserInterface,
    @Body() req: ChangePasswordDto,
  ) {
    return await this.userService.changePassword(user.id, req);
  }

  @Get('addresses')
  @ResponseMessage('Addresses retrieved successfully')
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              city: { type: 'string' },
              district: { type: 'string' },
              ward: { type: 'string' },
              street: { type: 'string' },
              address_line: { type: 'string' },
              type: { type: 'string' },
              is_primary: { type: 'boolean' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              country: { type: 'string' },
              postal_code: { type: 'string' },
              state: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAddresses(@User() user: UserInterface) {
    return await this.userService.getUserAddresses(user.id);
  }

  @Post('address')
  @ResponseMessage('Address created successfully')
  @ApiOperation({ summary: 'Create new user address' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
    schema: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            ward: { type: 'string' },
            street: { type: 'string' },
            address_line: { type: 'string' },
            type: { type: 'string' },
            is_primary: { type: 'boolean' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            country: { type: 'string' },
            postal_code: { type: 'string' },
            state: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAddress(
    @User() user: UserInterface,
    @Body() req: CreateAddressDto,
  ) {
    return await this.userService.createAddress(user.id, req);
  }

  @Put('address/:locationId')
  @ResponseMessage('Address updated successfully')
  @ApiOperation({ summary: 'Update user address' })
  @ApiParam({
    name: 'locationId',
    description: 'Address/Location ID to update',
    example: '123',
  })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
    schema: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            ward: { type: 'string' },
            street: { type: 'string' },
            address_line: { type: 'string' },
            type: { type: 'string' },
            is_primary: { type: 'boolean' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            country: { type: 'string' },
            postal_code: { type: 'string' },
            state: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @User() user: UserInterface,
    @Param('locationId') locationId: string,
    @Body() req: UpdateAddressDto,
  ) {
    return await this.userService.updateAddress(user.id, locationId, req);
  }

  @Delete('address/:locationId')
  @ResponseMessage('Address deleted successfully')
  @ApiOperation({ summary: 'Delete user address' })
  @ApiParam({
    name: 'locationId',
    description: 'Address/Location ID to delete',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Address not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAddress(
    @User() user: UserInterface,
    @Param('locationId') locationId: string,
  ) {
    return await this.userService.deleteUserAddress(user.id, locationId);
  }

  // Payment Method Management Endpoints
  @Get('payment-methods')
  @ResponseMessage('Payment methods retrieved successfully')
  @ApiOperation({ summary: 'Get all user payment methods' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserPaymentMethods(@User() user: UserInterface) {
    return await this.userService.getUserPaymentMethods(user.id);
  }

  @Post('payment-method')
  @ResponseMessage('Payment method created successfully')
  @ApiOperation({ summary: 'Create new user payment method' })
  @ApiResponse({
    status: 201,
    description: 'Payment method created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment method data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPaymentMethod(
    @User() user: UserInterface,
    @Body() req: any, // TODO: Import CreatePaymentMethodDto
  ) {
    return await this.userService.createPaymentMethod(user.id, req);
  }

  @Put('payment-method/:paymentMethodId')
  @ResponseMessage('Payment method updated successfully')
  @ApiOperation({ summary: 'Update user payment method' })
  @ApiParam({
    name: 'paymentMethodId',
    description: 'Payment method ID to update',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment method data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async updatePaymentMethod(
    @User() user: UserInterface,
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() req: any, // TODO: Import UpdatePaymentMethodDto
  ) {
    return await this.userService.updatePaymentMethod(
      user.id,
      paymentMethodId,
      req,
    );
  }

  @Delete('payment-method/:paymentMethodId')
  @ResponseMessage('Payment method deleted successfully')
  @ApiOperation({ summary: 'Delete user payment method' })
  @ApiParam({
    name: 'paymentMethodId',
    description: 'Payment method ID to delete',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Payment method not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePaymentMethod(
    @User() user: UserInterface,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.userService.deletePaymentMethod(user.id, paymentMethodId);
  }
}
