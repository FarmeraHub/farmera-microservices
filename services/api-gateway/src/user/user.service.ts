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
import { Observable } from 'rxjs';

// gRPC response interfaces
interface GetUserProfileResponse {
  user: any;
  stats: {
    total_orders: number;
    total_reviews: number;
    loyalty_points: number;
    member_since: any;
  };
}

interface UpdateUserProfileResponse {
  user: any;
}

interface ChangePasswordResponse {
  success: boolean;
  message?: string;
}

interface UpdatePasswordResponse {
  success: boolean;
  requires_relogin: boolean;
}

interface UpdateUserLocationResponse {
  location: any;
}

interface GetUserLocationsResponse {
  locations: any[];
}

interface DeleteUserLocationResponse {
  success: boolean;
}

interface AddUserLocationResponse {
  location: any;
}

interface LoginResponse {
  user: any;
  token_info: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  requires_verification: boolean;
  verification_type: string;
}

// gRPC service interface
interface UsersGrpcService {
  login(data: any): Observable<LoginResponse>;
  updatePassword(data: any): Observable<UpdatePasswordResponse>;
  getUserProfile(data: any): Observable<GetUserProfileResponse>;
  updateUserProfile(data: any): Observable<UpdateUserProfileResponse>;
  updateUserLocation(data: any): Observable<UpdateUserLocationResponse>;
  getUserLocations(data: any): Observable<GetUserLocationsResponse>;
  deleteUserLocation(data: any): Observable<DeleteUserLocationResponse>;
  addUserLocation(data: any): Observable<AddUserLocationResponse>;
}

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  private usersGrpcService: UsersGrpcService;

  constructor(
    @Inject('USERS_GRPC_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.usersGrpcService =
      this.client.getService<UsersGrpcService>('UsersService');
  }

  async getUserProfile(userId: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(`Getting user profile for user: ${userId}`);

      const result = await firstValueFrom(
        this.usersGrpcService.getUserProfile({
          user_id: userId,
        }),
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

      // Convert birthday string to timestamp if provided
      const updateData: any = {
        user_id: userId,
        ...req,
      };

      if (req.birthday) {
        updateData.birthday = {
          seconds: Math.floor(new Date(req.birthday).getTime() / 1000),
          nanos: 0,
        };
      }

      const result = await firstValueFrom(
        this.usersGrpcService.updateUserProfile(updateData),
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
      const userProfile = await firstValueFrom(
        this.usersGrpcService.getUserProfile({
          user_id: userId,
        }),
      );

      if (!userProfile.user) {
        throw new UnauthorizedException('User not found');
      }

      // Validate old password by attempting a login
      try {
        await firstValueFrom(
          this.usersGrpcService.login({
            email: userProfile.user.email,
            password: req.oldPassword,
            remember_me: false,
            device_info: 'Password Change Validation',
          }),
        );
      } catch (loginError) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Update password using the forgot password flow (but we know it's valid)
      const result = (await firstValueFrom(
        this.usersGrpcService.updatePassword({
          email: userProfile.user.email,
          new_password: req.newPassword,
          code: '', // Empty code since we validated via login
        }),
      )) as UpdatePasswordResponse;

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

      const result = await firstValueFrom(
        this.usersGrpcService.getUserLocations({
          user_id: userId,
        }),
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

      // Convert to the format expected by gRPC
      const locationData = {
        user_id: userId,
        location: {
          city: req.city,
          state: req.district || req.state || '', // Map district to state for gRPC
          address_line: req.address_line,
          country: req.country || 'VN',
          postal_code: req.postal_code || '',
          latitude: req.latitude || 0,
          longitude: req.longitude || 0,
          is_default: req.is_primary || false,
        },
      };

      const result = await firstValueFrom(
        this.usersGrpcService.addUserLocation(locationData),
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

      // Convert to the format expected by gRPC
      const updateData: any = {
        user_id: userId,
        location_id: locationId,
        location: {
          ...req,
        },
      };

      const result = await firstValueFrom(
        this.usersGrpcService.updateUserLocation(updateData),
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

      const result = await firstValueFrom(
        this.usersGrpcService.deleteUserLocation({
          user_id: userId,
          location_id: locationId,
        }),
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

      // Check if it's a not found error
      if (error.message?.includes('not found') || error.code === 5) {
        throw new BadRequestException(error.details || 'Address not found');
      }

      // Use error.details if available, otherwise provide a generic message
      throw new BadRequestException(
        error.details || 'Failed to delete user address',
      );
    }
  }
}
