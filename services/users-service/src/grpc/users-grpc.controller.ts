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
  GetLocationByIdRequest,
  GetLocationByIdResponse,
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
import { UsersService } from 'src/users/users.service';
import { VerificationService } from 'src/verification/verification.service';
import { UserMapper } from './mappers/users/user.mapper';
import { TypesMapper } from './mappers/common/types.mapper';
import { PaginationMapper } from './mappers/common/pagination.mapper';
import { LocationMapper } from './mappers/users/location.mapper';
import { EnumsMapper } from './mappers/common/enums.mapper';
import { PaymentMapper } from './mappers/users/payment.mapper';
import { ErrorMapper } from './mappers/common/error.mapper';
import { CreateLocationDto } from 'src/users/dto/create-location.dto';
import { Observable } from 'rxjs';
import { UpdateAddressDto } from 'src/users/dto/update-address.dto';
import { UpdatePaymentMethodDto } from 'src/users/dto/payment-method.dto';

@Controller()
@UsersServiceControllerMethods()
export class UsersGrpcController implements UsersServiceController {
  private readonly logger = new Logger(UsersGrpcController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) { }

  // ====================================== Auth Methods ======================================
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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

  // ====================================== User Methods ======================================
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      this.logger.log(`gRPC CreateUser request for email: ${request.email}`);
      const createUserDto = {
        email: request.email,
        password: request.password,
        firstName: request.first_name,
        lastName: request.last_name,
        code: request.verification_code,
      };

      const user = await this.usersService.createUserSignUp(createUserDto);

      const result = UserMapper.anyToGrpcUser(user as any);

      return {
        user: result,
      };
    } catch (error) {
      this.logger.error(`CreateUser error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    try {
      const user = await this.usersService.getUserById(request.user_id);
      return {
        user: UserMapper.userToGrpcUser(user),
      };
    } catch (error) {
      this.logger.error(`GetUser error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      const user = await this.usersService.updateUser(
        request.user_id,
        {
          first_name: request.first_name,
          last_name: request.last_name,
          gender: EnumsMapper.fromGrpcGender(request.gender),
          avatar: request.avatar_url,
          birthday: TypesMapper.fromGrpcTimestamp(request.birthday),
        }
      );

      return { user: UserMapper.userToGrpcUser(user) };
    } catch (error) {
      this.logger.error(`UpdateUser error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    try {
      const result = await this.usersService.deleteUser(
        request.user_id,
        request.hard_delete || false,
      );
      return result;
    } catch (error) {
      this.logger.error(`DeleteUser error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    try {
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
      throw ErrorMapper.toRpcException(error);
    }
  }

  // ====================================== Verification Methods ======================================
  async sendVerificationEmail(
    request: SendVerificationEmailRequest,
  ): Promise<SendVerificationEmailResponse> {
    try {
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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

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
      throw ErrorMapper.toRpcException(error);
    }
  }

  // ====================================== User Profile Methods ======================================
  async getUserProfile(
    request: GetUserProfileRequest,
  ): Promise<GetUserProfileResponse> {
    try {
      const result = await this.usersService.getUserProfile(request.user_id);
      return {
        user: UserMapper.userToGrpcUser(result.user),
        stats: UserMapper.anyToProfileStats(result.stats),
      };
    } catch (error) {
      this.logger.error(`GetUserProfile error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async deletePaymentMethod(request: DeletePaymentMethodRequest): Promise<DeletePaymentMethodResponse> {
    try {
      const result = await this.usersService.deletePaymentMethod(request.payment_method_id);
      return {
        success: result.success,
      };
    } catch (error) {
      this.logger.error(`DeletePaymentMethod error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getPaymentMethods(request: GetPaymentMethodsRequest): Promise<GetPaymentMethodsResponse> {
    try {
      const paymentMethods = await this.usersService.getUserPaymentMethods(request.user_id);
      return {
        payment_methods: paymentMethods.map((paymentMethod) => PaymentMapper.toGrpcPaymentMethod(paymentMethod)),
      };
    } catch (error) {
      this.logger.error(`GetPaymentMethods error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  // ====================================== Location Methods ======================================
  async addUserLocation(
    request: AddUserLocationRequest,
  ): Promise<AddUserLocationResponse> {
    try {
      const location = await this.usersService.addUserLocation(
        request.user_id,
        {
          address_line: request.address_line,
          city: request.city,
          district: request.district,
          ward: request.ward,
          street: request.street,
          is_primary: request.is_primary,
          type: request.type,
          user_id: request.user_id,
        },
      );

      return {
        location: LocationMapper.toGrpcLocation(location),
      };
    } catch (error) {
      this.logger.error(`AddUserLocation error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async updateUserLocation(
    request: UpdateUserLocationRequest,
  ): Promise<UpdateUserLocationResponse> {
    try {
      const locationData: UpdateAddressDto = {
        city: request.city,
        district: request.district,
        address_line: request.address_line,
        street: request.street,
        is_primary: request.is_primary,
        type: request.type,
        ward: request.ward,
      };

      const location = await this.usersService.updateUserLocation(
        request.location_id,
        request.user_id,
        locationData,
      );

      return {
        location: LocationMapper.toGrpcLocation(location),
      };
    } catch (error) {
      this.logger.error(`UpdateUserLocation error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async deleteUserLocation(
    request: DeleteUserLocationRequest,
  ): Promise<DeleteUserLocationResponse> {
    try {
      const result = await this.usersService.deleteUserLocation(
        request.user_id,
        request.location_id,
      );

      return {
        success: result.success,
      };
    } catch (error) {
      this.logger.error(`DeleteUserLocation error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getUserLocations(
    request: GetUserLocationsRequest,
  ): Promise<GetUserLocationsResponse> {
    try {
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
      throw ErrorMapper.toRpcException(error);
    }
  }

  async getLocationById(request: GetLocationByIdRequest): Promise<GetLocationByIdResponse> {
    try {
      const location = await this.usersService.findLocationById(request.id);
      return {
        location: LocationMapper.toGrpcLocation(location),
      };

    } catch (error) {
      this.logger.error(`GetLocationByUser error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  // ====================================== Payment Methods ======================================
  async addPaymentMethod(
    request: AddPaymentMethodRequest,
  ): Promise<AddPaymentMethodResponse> {
    try {
      const paymentMethod = await this.usersService.addPaymentMethod(
        request.user_id,
        {
          provider: EnumsMapper.fromGrpcPaymentProvider(request.provider),
          external_id: request.external_id,
          last_four: request.last_four,
          card_type: request.card_type,
          expiry_date: request.expiry_date,
          cardholder_name: request.cardholder_name,
          billing_address: request.billing_address,
          token: request.token,
          is_default: request.is_default,
        },
      );

      return {
        payment_method: PaymentMapper.toGrpcPaymentMethod(paymentMethod),
      };
    } catch (error) {
      this.logger.error(`AddPaymentMethod error: ${error.message}`);
      throw ErrorMapper.toRpcException(error);
    }
  }

  async updatePaymentMethod(
    request: UpdatePaymentMethodRequest,
  ): Promise<UpdatePaymentMethodResponse> {
    try {
      this.logger.log(
        `gRPC UpdatePaymentMethod request for user: ${request.user_id}, payment method: ${request.id}`,
      );

      if (!request.id) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Payment method data is required',
        });
      }

      const paymentData: UpdatePaymentMethodDto = {
        provider: EnumsMapper.fromGrpcPaymentProvider(request.provider),
        external_id: request.external_id,
        last_four: request.last_four,
        cardholder_name: request.cardholder_name,
        is_default: request.is_default,
        expiry_date: request.expiry_date,
        card_type: request.card_type,
        billing_address: request.billing_address,
        token: request.token,
        is_active: request.is_active,
      };

      const paymentMethod = await this.usersService.updatePaymentMethod(
        request.user_id,
        request.id,
        paymentData,
      );

      if (!paymentMethod) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Payment method not found',
        });
      }

      return {
        payment_method: PaymentMapper.toGrpcPaymentMethod(paymentMethod),
      };
    } catch (error) {
      this.logger.error(`UpdatePaymentMethod error: ${error.message}`);
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message || 'Failed to update payment method',
      });
    }
  }

  // ====================================== Admin Methods ======================================
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
}
