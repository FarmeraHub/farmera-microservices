import {
  AddPaymentMethodRequest,
  AddPaymentMethodResponse,
  AddUserLocationRequest,
  AddUserLocationResponse,
  CreateUserRequest,
  CreateUserResponse,
  DeletePaymentMethodRequest,
  DeletePaymentMethodResponse,
  DeleteUserLocationRequest,
  DeleteUserLocationResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GetPaymentMethodsRequest,
  GetPaymentMethodsResponse,
  GetUserLocationsRequest,
  GetUserLocationsResponse,
  GetUserProfileRequest,
  GetUserProfileResponse,
  GetUserRequest,
  GetUserResponse,
  GetUsersByRoleRequest,
  GetUsersByRoleResponse,
  GetUserStatsRequest,
  GetUserStatsResponse,
  ListUsersRequest,
  ListUsersResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SendVerificationEmailRequest,
  SendVerificationEmailResponse,
  SendVerificationPhoneRequest,
  SendVerificationPhoneResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdatePaymentMethodRequest,
  UpdatePaymentMethodResponse,
  UpdateUserLocationRequest,
  UpdateUserLocationResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
  UsersServiceController,
  UsersServiceControllerMethods,
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyPhoneRequest,
  VerifyPhoneResponse,
} from '@farmera/grpc-proto/dist/users/users';
import { status } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthService } from 'src/auth/auth.service';
import { Public } from 'src/decorators/public.decorator';
import { UsersService } from 'src/users/users.service';
import { VerificationService } from 'src/verification/verification.service';
import { UserMapper } from './mappers/users/user.mapper';
import { TypesMapper } from './mappers/common/types.mapper';
import { PaginationMapper } from './mappers/common/pagination.mapper';
import { LocationMapper } from './mappers/users/location.mapper';
import { EnumsMapper } from './mappers/common/enums.mapper';
import { PaymentMapper } from './mappers/users/payment.mapper';

@Controller()
@UsersServiceControllerMethods()
export class UsersGrpcController implements UsersServiceController {
  private readonly logger = new Logger(UsersGrpcController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  @Public()
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      this.logger.log(
        `gRPC Login request for email: ${JSON.stringify(request.email)}`,
      );

      const result = await this.authService.login(
        { email: request.email, password: request.password },
        {} as any, // Mock response object - gRPC doesn't use cookies
      );

      if (!result) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      return {
        user: result.user ? UserMapper.anyToGrpcUser(result.user) : undefined,
        token_info: UserMapper.createTokenInfo(
          result.access_token,
          result.refresh_token,
          7 * 24 * 60 * 60 * 1000,
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

  @Public()
  async refreshToken(
    request: RefreshTokenRequest,
  ): Promise<RefreshTokenResponse> {
    try {
      this.logger.log('gRPC RefreshToken request');

      const result = await this.authService.processNewToken(
        request.refresh_token,
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

  @Public()
  async logout(request: LogoutRequest): Promise<LogoutResponse> {
    try {
      this.logger.log(`gRPC Logout request for user: ${request.user_id}`);

      // Verify user exists
      await this.usersService.getUserById(request.user_id);

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

  @Public()
  async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> {
    try {
      this.logger.log(
        `gRPC ForgotPassword request for email: ${request.email}`,
      );

      await this.authService.forgotPassword({
        email: request.email,
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

  @Public()
  async updatePassword(
    request: UpdatePasswordRequest,
  ): Promise<UpdatePasswordResponse> {
    try {
      this.logger.log(`gRPC UpdatePassword request for user: ${request.email}`);

      await this.authService.updateNewPassword({
        email: request.email,
        code: request.code || '',
        newPassword: request.new_password,
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

  @Public()
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      this.logger.log(`gRPC CreateUser request for email: ${request.email}`);

      console.log(request);

      const createUserDto = {
        email: request.email,
        password: request.password,
        firstName: request.first_name,
        lastName: request.last_name,
        code: request.verification_code,
      };

      const user = await this.usersService.createUserSignUp(createUserDto);

      return {
        user: UserMapper.anyToGrpcUser(user as any),
      };
    } catch (error) {
      this.logger.error(`CreateUser error: ${error.message}`);
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: error.message || 'Failed to create user',
      });
    }
  }

  @Public()
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    try {
      this.logger.log(
        `gRPC GetUser request for user: ${JSON.stringify(request)}`,
      );
      this.logger.log(
        `gRPC GetUser request for user: ${JSON.stringify(request.user_id)}`,
      );

      const user = await this.usersService.getUserById(request.user_id);

      return {
        user: UserMapper.userToGrpcUser(user),
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

  @Public()
  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      this.logger.log(`gRPC UpdateUser request for user: ${request.user_id}`);

      const updateData: any = {};
      if (request.first_name) updateData.first_name = request.first_name;
      if (request.last_name) updateData.last_name = request.last_name;
      if (request.phone) updateData.phone = request.phone;
      if (request.gender) updateData.gender = request.gender;
      if (request.avatar_url) updateData.avatar = request.avatar_url;
      if (request.birthday)
        updateData.birthday = TypesMapper.fromGrpcTimestamp(request.birthday);

      const user = await this.usersService.updateUser(
        request.user_id,
        updateData,
      );

      return { user: UserMapper.userToGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUser error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user',
      });
    }
  }

  @Public()
  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    try {
      this.logger.log(`gRPC DeleteUser request for user: ${request.user_id}`);

      const result = await this.usersService.deleteUser(
        request.user_id,
        request.hard_delete || false,
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

  @Public()
  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    try {
      this.logger.log('gRPC ListUsers request');

      const filters: any = {};
      if (request.pagination) {
        filters.page = request.pagination.page || 1;
        filters.limit = request.pagination.limit || 10;
      }
      if (request.role_filter) filters.role_filter = request.role_filter;
      if (request.status_filter) filters.status_filter = request.status_filter;
      if (request.search_query) filters.search_query = request.search_query;
      if (request.created_date_range) {
        filters.created_date_range = {
          start_time: request.created_date_range.start_time
            ? TypesMapper.fromGrpcTimestamp(
                request.created_date_range.start_time,
              )
            : undefined,
          end_time: request.created_date_range.end_time
            ? TypesMapper.fromGrpcTimestamp(request.created_date_range.end_time)
            : undefined,
        };
      }

      const result = await this.usersService.listUsers(filters);

      return {
        users: result.users.map((user) => UserMapper.userToGrpcUser(user)),
        pagination: PaginationMapper.toPaginationResponse(
          result.pagination.total_items,
          result.pagination.current_page,
          result.pagination.page_size,
        ),
      };
    } catch (error) {
      this.logger.error(`ListUsers error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to list users',
      });
    }
  }

  @Public()
  async sendVerificationEmail(
    request: SendVerificationEmailRequest,
  ): Promise<SendVerificationEmailResponse> {
    try {
      this.logger.log(`gRPC SendVerificationEmail request`);

      let email = request.email;
      if (!email) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Email is required',
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

  @Public()
  async verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    try {
      this.logger.log(`gRPC VerifyEmail request`);

      if (request.verification_code) {
        await this.verificationService.verifyCode({
          email: request.email as string,
          code: request.verification_code,
        });

        // Clean up verification
        await this.verificationService.deleteVerification(
          request.email as string,
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`VerifyEmail error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to verify email',
      });
    }
  }

  @Public()
  async sendVerificationPhone(
    request: SendVerificationPhoneRequest,
  ): Promise<SendVerificationPhoneResponse> {
    try {
      this.logger.log(`gRPC SendVerificationPhone request`);

      if (!request.phone) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Phone number is required',
        });
      }

      await this.verificationService.createPhoneVerification({
        phone: request.phone,
      });

      return {
        success: true,
        message: 'Verification SMS sent',
      };
    } catch (error) {
      this.logger.error(`SendVerificationPhone error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to send verification SMS',
      });
    }
  }

  @Public()
  async verifyPhone(request: VerifyPhoneRequest): Promise<VerifyPhoneResponse> {
    try {
      this.logger.log(`gRPC VerifyPhone request`);

      if (request.verification_code) {
        await this.verificationService.verifyPhoneCode({
          phone: request.phone as string,
          code: request.verification_code,
        });

        // Clean up verification
        await this.verificationService.deletePhoneVerification(
          request.phone as string,
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`VerifyPhone error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to verify phone',
      });
    }
  }

  @Public()
  async getUserProfile(
    request: GetUserProfileRequest,
  ): Promise<GetUserProfileResponse> {
    try {
      this.logger.log(
        `gRPC GetUserProfile request for user: ${request.user_id}`,
      );

      const result = await this.usersService.getUserProfile(request.user_id);

      return {
        user: UserMapper.userToGrpcUser(result.user),
        stats: UserMapper.anyToProfileStats(result.stats),
      };
    } catch (error) {
      this.logger.error(`GetUserProfile error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user profile',
      });
    }
  }

  @Public()
  async updateUserProfile(
    request: UpdateUserProfileRequest,
  ): Promise<UpdateUserProfileResponse> {
    try {
      this.logger.log(
        `gRPC UpdateUserProfile request for user: ${request.user_id}`,
      );

      const profileData: any = {};
      if (request.first_name) profileData.first_name = request.first_name;
      if (request.last_name) profileData.last_name = request.last_name;
      if (request.phone) profileData.phone = request.phone;
      if (request.gender)
        profileData.gender = EnumsMapper.fromGrpcGender(request.gender);
      if (request.avatar_url) profileData.avatar = request.avatar_url;
      if (request.birthday)
        profileData.birthday = TypesMapper.fromGrpcTimestamp(request.birthday);

      const user = await this.usersService.updateUserProfile(
        request.user_id,
        profileData,
      );

      return { user: UserMapper.userToGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUserProfile error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user profile',
      });
    }
  }

  @Public()
  async addUserLocation(
    request: AddUserLocationRequest,
  ): Promise<AddUserLocationResponse> {
    try {
      this.logger.log(
        `gRPC AddUserLocation request for user: ${request.user_id}`,
      );

      const location = await this.usersService.addUserLocation(
        request.user_id,
        {
          name: request.location?.name || '',
          phone: request.location?.phone || '',
          address_line: request.location?.address_line || '',
          city: request.location?.city || '',
          state: request.location?.state || '',
          postal_code: request.location?.postal_code || '',
          country: request.location?.country || '',
          latitude: request.location?.latitude || 0,
          longitude: request.location?.longitude || 0,
          is_default: request.location?.is_default || false,
        },
      );

      return {
        location: LocationMapper.toGrpcLocation(location),
      };
    } catch (error) {
      this.logger.error(`AddUserLocation error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to add user location',
      });
    }
  }

  @Public()
  async addPaymentMethod(
    request: AddPaymentMethodRequest,
  ): Promise<AddPaymentMethodResponse> {
    try {
      this.logger.log(
        `gRPC AddPaymentMethod request for user: ${request.user_id}`,
      );

      if (!request.payment_method) {
        throw new Error('Invalid payment method');
      }

      const paymentMethod = await this.usersService.addPaymentMethod(
        request.user_id,
        {
          type: EnumsMapper.fromGrpcPaymentMethodType(
            request.payment_method.type,
          ),
          display_name: request.payment_method.display_name,
          last_four_digits: request.payment_method.last_four_digits,
          provider: request.payment_method.provider,
          is_default: request.payment_method.is_default,
          expires_at: request.payment_method.expires_at
            ? TypesMapper.fromGrpcTimestamp(request.payment_method.expires_at)
            : undefined,
          metadata: request.payment_method.metadata,
        },
      );

      return {
        payment_method: PaymentMapper.toGrpcPaymentMethod(paymentMethod),
      };
    } catch (error) {
      this.logger.error(`AddPaymentMethod error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to add payment method',
      });
    }
  }

  @Public()
  async getUsersByRole(
    request: GetUsersByRoleRequest,
  ): Promise<GetUsersByRoleResponse> {
    try {
      this.logger.log(`gRPC GetUsersByRole request for role: ${request.role}`);

      const result = await this.usersService.getUsersByRole(
        EnumsMapper.fromGrpcUserRole(request.role),
        request.pagination,
      );

      return {
        users: result.users.map((user) => UserMapper.userToGrpcUser(user)),
        pagination: PaginationMapper.toPaginationResponse(
          result.pagination.total_items,
          result.pagination.current_page,
          result.pagination.page_size,
        ),
      };
    } catch (error) {
      this.logger.error(`GetUsersByRole error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get users by role',
      });
    }
  }

  @Public()
  async updateUserStatus(
    request: UpdateUserStatusRequest,
  ): Promise<UpdateUserStatusResponse> {
    try {
      this.logger.log(
        `gRPC UpdateUserStatus request for user: ${request.user_id}`,
      );

      const user = await this.usersService.updateUserStatus(
        request.user_id,
        EnumsMapper.fromGrpcUserStatus(request.status),
        request.reason,
        request.admin_id,
      );

      return { user: UserMapper.userToGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUserStatus error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user status',
      });
    }
  }

  async getUserStats(
    request: GetUserStatsRequest,
  ): Promise<GetUserStatsResponse> {
    try {
      this.logger.log(`gRPC GetUserStats request ${request}`);

      const filters: any = {};

      if (request.date_range) {
        filters.date_range = {
          start_time: request.date_range.start_time
            ? TypesMapper.fromGrpcTimestamp(request.date_range.start_time)
            : undefined,
          end_time: request.date_range.end_time
            ? TypesMapper.fromGrpcTimestamp(request.date_range.end_time)
            : undefined,
        };
      }

      if (request.role_filter) filters.role_filter = request.role_filter;

      const stats = await this.usersService.getUserStats(filters);

      return { stats: UserMapper.anyToGrpcUserStatistic(stats) };
    } catch (error) {
      this.logger.error(`GetUserStats error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user stats',
      });
    }
  }

  @Public()
  async updateUserLocation(
    request: UpdateUserLocationRequest,
  ): Promise<UpdateUserLocationResponse> {
    try {
      this.logger.log(
        `gRPC UpdateUserLocation request for user: ${request.user_id}, location: ${request.location_id}`,
      );

      if (!request.location) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Location data is required',
        });
      }

      const locationData = {
        city: request.location.city,
        district: request.location.state, // Map state to district for our entity
        address_line: request.location.address_line,
        street: request.location.address_line, // Use address_line as street
        is_primary: request.location.is_default, // Map is_default to is_primary
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        country: request.location.country,
        postal_code: request.location.postal_code,
        state: request.location.state,
      };

      const location = await this.usersService.updateUserLocation(
        request.location_id,
        locationData,
      );

      if (!location) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Location not found',
        });
      }

      return {
        location: LocationMapper.toGrpcLocation(location),
      };
    } catch (error) {
      this.logger.error(`UpdateUserLocation error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update user location',
      });
    }
  }

  @Public()
  async deleteUserLocation(
    request: DeleteUserLocationRequest,
  ): Promise<DeleteUserLocationResponse> {
    try {
      this.logger.log(
        `gRPC DeleteUserLocation request for user: ${request.user_id}, location: ${request.location_id}`,
      );

      const result = await this.usersService.deleteUserLocation(
        request.location_id,
      );

      return {
        success: result.success,
      };
    } catch (error) {
      this.logger.error(`DeleteUserLocation error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to delete user location',
      });
    }
  }

  @Public()
  async getUserLocations(
    request: GetUserLocationsRequest,
  ): Promise<GetUserLocationsResponse> {
    try {
      this.logger.log(
        `gRPC GetUserLocations request for user: ${request.user_id}`,
      );

      const locations = await this.usersService.getUserLocations(
        request.user_id,
      );

      return {
        locations: locations.map((location) =>
          LocationMapper.toGrpcLocation(location),
        ),
      };
    } catch (error) {
      this.logger.error(`GetUserLocations error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to get user locations',
      });
    }
  }
}
