import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import { UsersServiceClient } from '@farmera/grpc-proto/dist/users/users';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { EnumMapper } from 'src/mappers/common/enum.mapper';
import { UpdateProfileDto } from 'src/user/user/dto/update-profile.dto';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { User } from './entities/user.entity';
import { UserMapper } from 'src/mappers/users/user.mapper';
import { LocationMapper } from 'src/mappers/users/location.mapper';
import { Location } from './entities/location.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMapper } from 'src/mappers/users/payment.mapper';
import { PaymentMethod } from './entities/payment_method.entity';
import { UpdatePaymentMethodDto } from './dto/update-payment.dto';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  private usersGrpcService: UsersServiceClient;

  constructor(
    @Inject('USERS_GRPC_PACKAGE') private readonly client: ClientGrpc,
  ) { }

  onModuleInit() {
    this.usersGrpcService =
      this.client.getService<UsersServiceClient>('UsersService');
  }

  // ================================ User Methods ================================
  async getUserProfile(userId: string) {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.getUserProfile({ user_id: userId }),
      );

      if (result.user) {
        this.logger.log('User profile retrieved successfully');
        return {
          user: UserMapper.fromGrpcUser(result.user),
          stats: UserMapper.fromGrpcProfileStats(result.stats),
        };
      }

      throw new Error('Failed to get user profile');
    } catch (error) {
      this.logger.error(`Get user profile failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async updateProfile(userId: string, req: UpdateProfileDto): Promise<User> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.updateUser({
          user_id: userId,
          first_name: req.first_name,
          last_name: req.last_name,
          gender: EnumMapper.toGrpcGender(req.gender),
          avatar_url: req.avatar_url,
          birthday: TypesMapper.toGrpcTimestamp(req.birthday),
        }),
      );

      if (result.user) {
        this.logger.log('User profile updated successfully');
        return UserMapper.fromGrpcUser(result.user);
      }

      throw new Error('Failed to update user profile');
    } catch (error) {
      this.logger.error(`Update user profile failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  // ================================ Address Methods ================================
  async getUserAddresses(userId: string): Promise<Location[]> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.getUserLocations({ user_id: userId }),
      );
      return result.locations.map(location => LocationMapper.fromGrpcLocation(location));
    } catch (error) {
      this.logger.error(`Get user addresses failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async createAddress(userId: string, req: CreateAddressDto): Promise<Location> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.addUserLocation({
          user_id: userId,
          name: req.name,
          phone: req.phone,
          city: req.city,
          district: req.district,
          ward: req.ward,
          street: req.street,
          address_line: req.address_line,
          type: req.type,
          is_primary: req.is_primary,
        }),
      );

      this.logger.log('User address created successfully');
      return LocationMapper.fromGrpcLocation(result.location);

    } catch (error) {
      this.logger.error(`Create user address failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async updateAddress(
    userId: string,
    locationId: number,
    req: UpdateAddressDto,
  ): Promise<Location> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.updateUserLocation({
          user_id: userId,
          name: req.name,
          phone: req.phone,
          location_id: locationId,
          city: req.city,
          district: req.district,
          ward: req.ward,
          street: req.street,
          address_line: req.address_line,
          type: req.type,
          is_primary: req.is_primary,
        }),
      );

      this.logger.log('User address updated successfully');
      return LocationMapper.fromGrpcLocation(result.location);

    } catch (error) {
      this.logger.error(`Update user address failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async deleteUserAddress(userId: string, locationId: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.deleteUserLocation({
          user_id: userId,
          location_id: locationId,
        }),
      );

      if (result.success) {
        this.logger.log('User address deleted successfully');
        return true;
      }

      throw new Error('Failed to delete user address');
    } catch (error) {
      this.logger.error(`Delete user address failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  // ================================ Payment Methods ================================
  async addPaymentMethod(userId: string, req: CreatePaymentDto): Promise<PaymentMethod> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.addPaymentMethod({
          user_id: userId,
          provider: EnumMapper.toGrpcPaymentProvider(req.provider),
          external_id: req.external_id,
          last_four: req.last_four,
          card_type: req.card_type,
          expiry_date: req.expiry_date,
          cardholder_name: req.cardholder_name,
          billing_address: req.billing_address,
          token: req.token,
          is_default: req.is_default,
        }),
      );

      return PaymentMapper.fromGrpcPaymentMethod(result.payment_method);
    }
    catch (err) {
      this.logger.error(err.message);
      throw ErrorMapper.fromGrpcError(err);
    }
  }

  async deletePaymentMethod(userId: string, paymentMethodId: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.deletePaymentMethod({
          user_id: userId,
          payment_method_id: paymentMethodId,
        }),
      );
      return result.success;
    } catch (error) {
      this.logger.error(`Delete payment method failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const result = await firstValueFrom(
        this.usersGrpcService.getPaymentMethods({ user_id: userId }),
      );
      return result.payment_methods.map(paymentMethod => PaymentMapper.fromGrpcPaymentMethod(paymentMethod));
    } catch (error) {
      this.logger.error(`Get user payment methods failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }

  async updatePaymentMethod(userId: string, paymentMethodId: number, req: UpdatePaymentMethodDto) {
    try {
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      this.logger.log(
        `Updating payment method for user: ${userId}, payment method: ${paymentMethodId}`,
      );

      const result = await firstValueFrom(
        this.usersGrpcService.updatePaymentMethod({
          user_id: userId,
          id: paymentMethodId,
          provider: EnumMapper.toGrpcPaymentProvider(req.provider),
          external_id: req.external_id,
          last_four: req.last_four,
          card_type: req.card_type,
          expiry_date: req.expiry_date,
          cardholder_name: req.cardholder_name,
          billing_address: req.billing_address,
          token: req.token,
          is_default: req.is_default,
          is_active: req.is_active,
        }),
      );

      return PaymentMapper.fromGrpcPaymentMethod(result.payment_method);
    } catch (error) {
      this.logger.error(`Update payment method failed: ${error.message}`);
      throw ErrorMapper.fromGrpcError(error);
    }
  }
}
