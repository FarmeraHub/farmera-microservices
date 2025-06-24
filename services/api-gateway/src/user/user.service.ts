import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateAddressDto,
  CreateAddressDto,
} from './dto';
import { ClientGrpc } from '@nestjs/microservices';
import {
  GetUserProfileRequest,
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  LoginRequest,
  LoginResponse,
  UpdateUserLocationRequest,
  UpdateUserLocationResponse,
  GetUserLocationsRequest,
  GetUserLocationsResponse,
  DeleteUserLocationRequest,
  DeleteUserLocationResponse,
  AddUserLocationRequest,
  AddUserLocationResponse,
  UsersServiceClient,
} from '@farmera/grpc-proto/dist/users/users';
import { Gender } from '@farmera/grpc-proto/dist/common/enums';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  private usersGrpcService: UsersServiceClient;

  constructor(
    @Inject('USERS_GRPC_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.usersGrpcService =
      this.client.getService<UsersServiceClient>('UsersService');
  }

  async getUserProfile(userId: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Getting user profile for user: ${userId}`);

      const grpcRequest: GetUserProfileRequest = {
        user_id: userId,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.getUserProfile(grpcRequest),
      );

      if (result.user) {
        this.logger.log('User profile retrieved successfully');
        return {
          user: result.user,
          stats: result.stats,
        };
      }

      throw new Error('Failed to get user profile');
    } catch (error) {
      this.logger.error(`Get user profile failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to get user profile',
      );
    }
  }

  async updateProfile(userId: string, req: UpdateProfileDto) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Updating user profile for user: ${userId}`);

      const grpcRequest: UpdateUserProfileRequest = {
        user_id: userId,
        first_name: req.first_name,
        last_name: req.last_name,
        phone: req.phone,
        gender: req.gender
          ? (() => {
              this.logger.log(`API Gateway received gender: ${req.gender}`);
              const mappedGender = this.mapGenderStringToGrpcEnum(
                req.gender.toString(),
              );
              this.logger.log(
                `API Gateway mapped gender to: ${mappedGender} (type: ${typeof mappedGender})`,
              );
              return mappedGender;
            })()
          : undefined,
        birthday: req.birthday
          ? {
              value: {
                seconds: Math.floor(new Date(req.birthday).getTime() / 1000),
                nanos: 0,
              },
            }
          : undefined,
        bio: req.bio,
        interests: [], // Can be extended
        preferences: {}, // Can be extended
        avatar_url: req.avatar_url,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.updateUserProfile(grpcRequest),
      );

      if (result.user) {
        this.logger.log('User profile updated successfully');
        return {
          user: result.user,
        };
      }

      throw new Error('Failed to update user profile');
    } catch (error) {
      this.logger.error(`Update user profile failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to update user profile',
      );
    }
  }

  async changePassword(userId: string, req: ChangePasswordDto) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Changing password for user: ${userId}`);

      // First, get user info to validate current password
      const userProfileRequest: GetUserProfileRequest = {
        user_id: userId,
      };

      const userProfile = await firstValueFrom(
        this.usersGrpcService.getUserProfile(userProfileRequest),
      );

      if (!userProfile.user) {
        throw new UnauthorizedException('User not found');
      }

      // Validate old password by attempting a login
      try {
        const loginRequest: LoginRequest = {
          email: userProfile.user.email,
          password: req.oldPassword,
          remember_me: false,
          device_info: 'Password Change Validation',
        };

        await firstValueFrom(this.usersGrpcService.login(loginRequest));
      } catch (loginError) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Update password using the forgot password flow (but we know it's valid)
      const updatePasswordRequest: UpdatePasswordRequest = {
        email: userProfile.user.email,
        new_password: req.newPassword,
        code: '', // Empty code since we validated via login
      };

      const result = await firstValueFrom(
        this.usersGrpcService.updatePassword(updatePasswordRequest),
      );

      if (result.success) {
        this.logger.log('Password changed successfully');
        return {
          success: true,
          message: 'Password changed successfully',
          requires_relogin: result.requires_relogin,
        };
      }

      throw new Error('Failed to change password');
    } catch (error) {
      this.logger.error(`Change password failed: ${error.message}`);

      // Check for specific error types
      if (error.message?.includes('Current password is incorrect')) {
        throw new BadRequestException('Current password is incorrect');
      }

      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to change password',
      );
    }
  }

  async getUserAddresses(userId: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Getting addresses for user: ${userId}`);

      const grpcRequest: GetUserLocationsRequest = {
        user_id: userId,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.getUserLocations(grpcRequest),
      );

      if (result.locations) {
        this.logger.log('User addresses retrieved successfully');
        return {
          locations: result.locations,
        };
      }

      return { locations: [] };
    } catch (error) {
      this.logger.error(`Get user addresses failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to get user addresses',
      );
    }
  }

  async createAddress(userId: string, req: CreateAddressDto) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Creating address for user: ${userId}`);

      const grpcRequest: AddUserLocationRequest = {
        user_id: userId,
        location: {
          id: '', // Will be generated by the service
          user_id: userId,
          name: req.name || '',
          phone: req.phone || '',
          address_line: req.address_line,
          city: req.city,
          state: req.district || req.state || '', // Map district to state for gRPC
          postal_code: req.postal_code || '',
          country: req.country || 'VN',
          latitude: req.latitude || 0,
          longitude: req.longitude || 0,
          is_default: req.is_primary || false,
          created_at: undefined, // Will be set by service
          updated_at: undefined, // Will be set by service
        },
      };

      const result = await firstValueFrom(
        this.usersGrpcService.addUserLocation(grpcRequest),
      );

      if (result.location) {
        this.logger.log('User address created successfully');
        return {
          location: result.location,
        };
      }

      throw new Error('Failed to create user address');
    } catch (error) {
      this.logger.error(`Create user address failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to create user address',
      );
    }
  }

  async updateAddress(
    userId: string,
    locationId: string,
    req: UpdateAddressDto,
  ) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(
        `Updating address for user: ${userId}, location: ${locationId}`,
      );

      const grpcRequest: UpdateUserLocationRequest = {
        user_id: userId,
        location_id: locationId,
        location: {
          id: locationId,
          user_id: userId,
          name: req.name || '',
          phone: req.phone || '',
          address_line: req.address_line || '',
          city: req.city || '',
          state: req.state || '',
          postal_code: req.postal_code || '',
          country: req.country || 'VN',
          latitude: req.latitude || 0,
          longitude: req.longitude || 0,
          is_default: req.is_primary || false,
          created_at: undefined,
          updated_at: undefined,
        },
      };

      const result = await firstValueFrom(
        this.usersGrpcService.updateUserLocation(grpcRequest),
      );

      if (result.location) {
        this.logger.log('User address updated successfully');
        return {
          location: result.location,
        };
      }

      throw new Error('Failed to update user address');
    } catch (error) {
      this.logger.error(`Update user address failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to update user address',
      );
    }
  }

  async deleteUserAddress(userId: string, locationId: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(
        `Deleting address for user: ${userId}, location: ${locationId}`,
      );

      const grpcRequest: DeleteUserLocationRequest = {
        user_id: userId,
        location_id: locationId,
      };

      const result = await firstValueFrom(
        this.usersGrpcService.deleteUserLocation(grpcRequest),
      );

      if (result.success) {
        this.logger.log('User address deleted successfully');
        return {
          success: true,
          message: 'Address deleted successfully',
        };
      }

      throw new Error('Failed to delete user address');
    } catch (error) {
      this.logger.error(`Delete user address failed: ${error.message}`);

      // Check if it's an authentication error
      if (error.message?.includes('authenticated') || error.code === 16) {
        throw new UnauthorizedException(
          error.details || 'User not authenticated',
        );
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to delete user address',
      );
    }
  }

  private mapGenderStringToGrpcEnum(gender: string): Gender {
    const genderMap: { [key: string]: Gender } = {
      GENDER_MALE: Gender.GENDER_MALE,
      GENDER_FEMALE: Gender.GENDER_FEMALE,
      GENDER_OTHER: Gender.GENDER_OTHER,
      GENDER_PREFER_NOT_TO_SAY: Gender.GENDER_PREFER_NOT_TO_SAY,
    };
    return genderMap[gender] || Gender.GENDER_UNSPECIFIED;
  }
}
