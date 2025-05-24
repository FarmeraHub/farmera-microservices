import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { VerificationService } from '../verification/verification.service';
import { UserMapper } from './mappers/user.mapper';
import {
  LoginRequest,
  RefreshTokenRequest,
  CreateUserRequest,
  GetUserRequest,
  UpdateUserRequest,
  DeleteUserRequest,
  ListUsersRequest,
  SendVerificationEmailRequest,
  VerifyEmailRequest,
  AddUserLocationRequest,
  AddPaymentMethodRequest,
  UpdateUserStatusRequest,
  GetUserStatsRequest,
} from './dto/grpc-request.dto';

@Controller()
export class UsersGrpcController {
  private readonly logger = new Logger(UsersGrpcController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  // Authentication Methods
  @GrpcMethod('UsersService', 'Login')
  async login(data: LoginRequest) {
    try {
      this.logger.log(`gRPC Login request for email: ${data.email}`);

      const result = await this.authService.login(
        { email: data.email, password: data.password },
        {} as any, // Mock response object - gRPC doesn't use cookies
      );

      if (!result) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      return {
        user: result.user ? UserMapper.toGrpcUser(result.user as any) : null,
        token_info: UserMapper.createTokenInfo(
          result.access_token,
          result.refresh_token,
          3600,
        ),
        requires_verification: false,
        verification_type: '',
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Login failed',
      });
    }
  }

  @GrpcMethod('UsersService', 'RefreshToken')
  async refreshToken(data: RefreshTokenRequest) {
    try {
      this.logger.log('gRPC RefreshToken request');

      const result = await this.authService.processNewToken(
        data.refresh_token,
        {} as any, // Mock response object
      );

      return {
        token_info: UserMapper.createTokenInfo(
          result.access_token,
          result.refresh_token,
          3600,
        ),
      };
    } catch (error) {
      this.logger.error(`RefreshToken error: ${error.message}`);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid refresh token',
      });
    }
  }

  @GrpcMethod('UsersService', 'ForgotPassword')
  async forgotPassword(data: { email: string }) {
    try {
      this.logger.log(`gRPC ForgotPassword request for email: ${data.email}`);

      await this.authService.forgotPassword({
        email: data.email,
      });

      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      this.logger.error(`ForgotPassword error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to send password reset email',
      });
    }
  }

  @GrpcMethod('UsersService', 'UpdatePassword')
  async updatePassword(data: {
    user_id: string;
    current_password?: string;
    new_password: string;
    reset_token?: string;
  }) {
    try {
      this.logger.log(`gRPC UpdatePassword request for user: ${data.user_id}`);

      // Get user email from user_id
      const user = await this.usersService.getUserById(data.user_id);

      await this.authService.updateNewPassword({
        email: user.email,
        code: data.reset_token || '',
        newPassword: data.new_password,
      });

      return {
        success: true,
        requires_relogin: true,
      };
    } catch (error) {
      this.logger.error(`UpdatePassword error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update password',
      });
    }
  }

  // User Management Methods
  @GrpcMethod('UsersService', 'CreateUser')
  async createUser(data: CreateUserRequest) {
    try {
      this.logger.log(`gRPC CreateUser request for email: ${data.email}`);

      const createUserDto = {
        email: data.email,
        password: data.password,
        firstName: data.first_name,
        lastName: data.last_name,
        code: '000000', // Note: You should implement proper verification
      };

      const user = await this.usersService.createUserSignUp(createUserDto);

      // Send verification email if requested
      if (data.send_verification_email) {
        await this.verificationService.create({ email: data.email });
      }

      return {
        user: UserMapper.toGrpcUser(user as any),
        verification_sent: data.send_verification_email || false,
      };
    } catch (error) {
      this.logger.error(`CreateUser error: ${error.message}`);
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: error.message || 'Failed to create user',
      });
    }
  }

  @GrpcMethod('UsersService', 'GetUser')
  async getUser(data: GetUserRequest) {
    try {
      this.logger.log(`gRPC GetUser request for user: ${data.user_id}`);

      const user = await this.usersService.getUserById(data.user_id);

      return {
        user: UserMapper.toGrpcUser(user),
      };
    } catch (error) {
      this.logger.error(`GetUser error: ${error.message}`);
      if (error instanceof RpcException) throw error;

      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user',
      });
    }
  }

  @GrpcMethod('UsersService', 'GetUserProfile')
  async getUserProfile(data: { user_id: string }) {
    try {
      this.logger.log(`gRPC GetUserProfile request for user: ${data.user_id}`);

      const result = await this.usersService.getUserProfile(data.user_id);

      return {
        user: UserMapper.toGrpcUser(result.user),
        stats: {
          total_orders: result.stats.total_orders,
          total_reviews: result.stats.total_reviews,
          loyalty_points: result.stats.loyalty_points,
          member_since: UserMapper.toGrpcTimestamp(result.stats.member_since),
        },
      };
    } catch (error) {
      this.logger.error(`GetUserProfile error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user profile',
      });
    }
  }

  @GrpcMethod('UsersService', 'SendVerificationEmail')
  async sendVerificationEmail(data: SendVerificationEmailRequest) {
    try {
      this.logger.log(`gRPC SendVerificationEmail request`);

      let email = data.email;
      if (!email && data.user_id) {
        const user = await this.usersService.getUserById(data.user_id);
        email = user.email;
      }

      if (!email) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Email or user_id is required',
        });
      }

      await this.verificationService.create({ email });

      return {
        success: true,
        message: 'Verification email sent',
      };
    } catch (error) {
      this.logger.error(`SendVerificationEmail error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to send verification email',
      });
    }
  }

  @GrpcMethod('UsersService', 'VerifyEmail')
  async verifyEmail(data: VerifyEmailRequest) {
    try {
      this.logger.log(`gRPC VerifyEmail request for user: ${data.user_id}`);

      const user = await this.usersService.getUserById(data.user_id);

      if (data.verification_code) {
        await this.verificationService.verifyCode({
          email: user.email,
          code: data.verification_code,
        });

        // Clean up verification
        await this.verificationService.deleteVerification(user.email);
      }

      return {
        success: true,
        user: UserMapper.toGrpcUser(user),
      };
    } catch (error) {
      this.logger.error(`VerifyEmail error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to verify email',
      });
    }
  }

  @GrpcMethod('UsersService', 'Logout')
  async logout(data: { user_id: string; device_id?: string }) {
    try {
      this.logger.log(`gRPC Logout request for user: ${data.user_id}`);

      // Verify user exists
      await this.usersService.getUserById(data.user_id);

      // Note: Implement session invalidation if you have session management
      // For JWT-based auth, client should discard the token

      return { success: true };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to logout',
      });
    }
  }

  @GrpcMethod('UsersService', 'UpdateUser')
  async updateUser(data: UpdateUserRequest) {
    try {
      this.logger.log(`gRPC UpdateUser request for user: ${data.user_id}`);

      const updateData: any = {};
      if (data.first_name) updateData.first_name = data.first_name;
      if (data.last_name) updateData.last_name = data.last_name;
      if (data.phone) updateData.phone = data.phone;
      if (data.gender) updateData.gender = data.gender;
      if (data.avatar_url) updateData.avatar = data.avatar_url;
      if (data.birthday)
        updateData.birthday = UserMapper.fromGrpcTimestamp(data.birthday);

      const user = await this.usersService.updateUser(data.user_id, updateData);

      return { user: UserMapper.toGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUser error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user',
      });
    }
  }

  @GrpcMethod('UsersService', 'DeleteUser')
  async deleteUser(data: DeleteUserRequest) {
    try {
      this.logger.log(`gRPC DeleteUser request for user: ${data.user_id}`);

      const result = await this.usersService.deleteUser(
        data.user_id,
        data.hard_delete || false,
      );

      return result;
    } catch (error) {
      this.logger.error(`DeleteUser error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to delete user',
      });
    }
  }

  @GrpcMethod('UsersService', 'ListUsers')
  async listUsers(data: ListUsersRequest) {
    try {
      this.logger.log('gRPC ListUsers request');

      const filters: any = {};
      if (data.pagination) {
        filters.page = data.pagination.page || 1;
        filters.limit = data.pagination.limit || 10;
      }
      if (data.role_filter) filters.role_filter = data.role_filter;
      if (data.status_filter) filters.status_filter = data.status_filter;
      if (data.search_query) filters.search_query = data.search_query;
      if (data.created_date_range) {
        filters.created_date_range = {
          start_time: data.created_date_range.start_time
            ? UserMapper.fromGrpcTimestamp(data.created_date_range.start_time)
            : undefined,
          end_time: data.created_date_range.end_time
            ? UserMapper.fromGrpcTimestamp(data.created_date_range.end_time)
            : undefined,
        };
      }

      const result = await this.usersService.listUsers(filters);

      return {
        users: result.users.map((user) => UserMapper.toGrpcUser(user)),
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`ListUsers error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to list users',
      });
    }
  }

  @GrpcMethod('UsersService', 'UpdateUserProfile')
  async updateUserProfile(data: any) {
    try {
      this.logger.log(
        `gRPC UpdateUserProfile request for user: ${data.user_id}`,
      );

      const profileData: any = {};
      if (data.first_name) profileData.first_name = data.first_name;
      if (data.last_name) profileData.last_name = data.last_name;
      if (data.phone) profileData.phone = data.phone;
      if (data.gender) profileData.gender = data.gender;
      if (data.avatar_url) profileData.avatar = data.avatar_url;
      if (data.birthday)
        profileData.birthday = UserMapper.fromGrpcTimestamp(data.birthday);

      const user = await this.usersService.updateUserProfile(
        data.user_id,
        profileData,
      );

      return { user: UserMapper.toGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUserProfile error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user profile',
      });
    }
  }

  @GrpcMethod('UsersService', 'AddUserLocation')
  async addUserLocation(data: AddUserLocationRequest) {
    try {
      this.logger.log(`gRPC AddUserLocation request for user: ${data.user_id}`);

      const location = await this.usersService.addUserLocation(data.user_id, {
        address_line: data.location.address_line,
        city: data.location.city,
        state: data.location.state,
        postal_code: data.location.postal_code,
        country: data.location.country,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        is_default: data.location.is_default,
      });

      return {
        location: {
          id: location.id.toString(),
          user_id: data.user_id,
          address_line: location.address_line || '',
          city: location.city,
          state: location.district,
          postal_code: data.location.postal_code || '',
          country: data.location.country || 'Vietnam',
          latitude: data.location.latitude || 0,
          longitude: data.location.longitude || 0,
          is_default: location.is_primary,
          created_at: UserMapper.toGrpcTimestamp(location.created_at),
          updated_at: UserMapper.toGrpcTimestamp(location.updated_at),
        },
      };
    } catch (error) {
      this.logger.error(`AddUserLocation error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to add user location',
      });
    }
  }

  @GrpcMethod('UsersService', 'AddPaymentMethod')
  async addPaymentMethod(data: AddPaymentMethodRequest) {
    try {
      this.logger.log(
        `gRPC AddPaymentMethod request for user: ${data.user_id}`,
      );

      const paymentMethod = await this.usersService.addPaymentMethod(
        data.user_id,
        {
          type: data.payment_method.type,
          display_name: data.payment_method.display_name,
          last_four_digits: data.payment_method.last_four_digits,
          provider: data.payment_method.provider,
          is_default: data.payment_method.is_default,
          expires_at: data.payment_method.expires_at
            ? UserMapper.fromGrpcTimestamp(data.payment_method.expires_at)
            : undefined,
          metadata: data.payment_method.metadata,
        },
      );

      return {
        payment_method: {
          id: paymentMethod.id.toString(),
          user_id: data.user_id,
          type: this.mapPaymentProviderToType(paymentMethod.provider),
          display_name:
            paymentMethod.cardholder_name || data.payment_method.display_name,
          last_four_digits: paymentMethod.last_four || '',
          provider: paymentMethod.provider,
          is_default: paymentMethod.is_default,
          expires_at: paymentMethod.expiry_date
            ? this.parseExpiryToTimestamp(paymentMethod.expiry_date)
            : null,
          created_at: UserMapper.toGrpcTimestamp(paymentMethod.created_at),
          updated_at: UserMapper.toGrpcTimestamp(paymentMethod.updated_at),
          metadata: paymentMethod.metadata
            ? JSON.parse(paymentMethod.metadata)
            : {},
        },
      };
    } catch (error) {
      this.logger.error(`AddPaymentMethod error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to add payment method',
      });
    }
  }

  @GrpcMethod('UsersService', 'GetUsersByRole')
  async getUsersByRole(data: { role: string; pagination?: any }) {
    try {
      this.logger.log(`gRPC GetUsersByRole request for role: ${data.role}`);

      const result = await this.usersService.getUsersByRole(
        data.role as any,
        data.pagination,
      );

      return {
        users: result.users.map((user) => UserMapper.toGrpcUser(user)),
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(`GetUsersByRole error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get users by role',
      });
    }
  }

  @GrpcMethod('UsersService', 'UpdateUserStatus')
  async updateUserStatus(data: UpdateUserStatusRequest) {
    try {
      this.logger.log(
        `gRPC UpdateUserStatus request for user: ${data.user_id}`,
      );

      const user = await this.usersService.updateUserStatus(
        data.user_id,
        data.status as any,
        data.reason,
        data.admin_id,
      );

      return { user: UserMapper.toGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUserStatus error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user status',
      });
    }
  }

  @GrpcMethod('UsersService', 'GetUserStats')
  async getUserStats(data: GetUserStatsRequest) {
    try {
      this.logger.log('gRPC GetUserStats request');

      const filters: any = {};
      if (data.date_range) {
        filters.date_range = {
          start_time: data.date_range.start_time
            ? UserMapper.fromGrpcTimestamp(data.date_range.start_time)
            : undefined,
          end_time: data.date_range.end_time
            ? UserMapper.fromGrpcTimestamp(data.date_range.end_time)
            : undefined,
        };
      }
      if (data.role_filter) filters.role_filter = data.role_filter;

      const stats = await this.usersService.getUserStats(filters);

      return { stats };
    } catch (error) {
      this.logger.error(`GetUserStats error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user stats',
      });
    }
  }

  // Helper methods
  private mapPaymentProviderToType(provider: string): number {
    switch (provider?.toLowerCase()) {
      case 'stripe':
      case 'credit_card':
        return 1;
      case 'paypal':
        return 3;
      case 'bank_transfer':
        return 4;
      default:
        return 0;
    }
  }

  private parseExpiryToTimestamp(expiry: string): any {
    try {
      const [month, year] = expiry.split('/');
      const fullYear = parseInt('20' + year);
      const expiryDate = new Date(fullYear, parseInt(month) - 1, 1);
      return UserMapper.toGrpcTimestamp(expiryDate);
    } catch {
      return null;
    }
  }
}
