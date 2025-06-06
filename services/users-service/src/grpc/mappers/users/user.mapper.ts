import { User as GrpcUser, ProfileStats, TokenInfo, UserStatistics as GrpcUserStatistics } from '@farmera/grpc-proto/dist/users/users';
import { User } from '../../../users/entities/user.entity';
import { TypesMapper } from '../common/types.mapper';
import { LocationMapper } from './location.mapper';
import { EnumsMapper } from '../common/enums.mapper';
import { PaymentMapper } from './payment.mapper';

// Mapper to convert TypeORM User entity to gRPC User message
export class UserMapper {
  static anyToGrpcUser(user: any): GrpcUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || '',
      first_name: user.first_name,
      last_name: user.last_name,
      farm_id: user.farm_id?.toString() || '',
      gender: EnumsMapper.toGrpcGender(user.gender),
      avatar_url: user.avatar || '',
      birthday: user.birthday ? TypesMapper.toGrpcTimestamp(user.birthday) : undefined,
      role: EnumsMapper.toGrpcUserRole(user.role),
      points: user.points || 0,
      status: EnumsMapper.toGrpcUserStatus(user.status),
      locations: user.locations
        ? user.locations.map((loc: any) => LocationMapper.toGrpcLocation(loc))
        : [],
      payment_methods: user.payment_methods
        ? user.payment_methods.map((pm: any) => PaymentMapper.toGrpcPaymentMethod(pm))
        : [],
      created_at: TypesMapper.toGrpcTimestamp(user.created_at),
      updated_at: TypesMapper.toGrpcTimestamp(user.updated_at),
      email_verified: true, // You may want to add this field to your entity
      phone_verified: false, // You may want to add this field to your entity
      last_login: undefined, // You may want to add this field to your entity
    };
  }

  static userToGrpcUser(user: User): GrpcUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || '',
      first_name: user.first_name,
      last_name: user.last_name,
      farm_id: user.farm_id?.toString() || '',
      gender: EnumsMapper.toGrpcGender(user.gender),
      avatar_url: user.avatar || '',
      birthday: user.birthday ? TypesMapper.toGrpcTimestamp(user.birthday) : undefined,
      role: EnumsMapper.toGrpcUserRole(user.role),
      points: user.points || 0,
      status: EnumsMapper.toGrpcUserStatus(user.status),
      locations: user.locations
        ? user.locations.map((loc) => LocationMapper.toGrpcLocation(loc))
        : [],
      payment_methods: user.payment_methods
        ? user.payment_methods.map((pm) => PaymentMapper.toGrpcPaymentMethod(pm))
        : [],
      created_at: TypesMapper.toGrpcTimestamp(user.created_at),
      updated_at: TypesMapper.toGrpcTimestamp(user.updated_at),
      email_verified: true, // You may want to add this field to your entity
      phone_verified: false, // You may want to add this field to your entity
      last_login: undefined, // You may want to add this field to your entity
    };
  }

  // Helper method to create token info
  static createTokenInfo(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): TokenInfo {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
      scopes: ['read', 'write'], // Define appropriate scopes
    };
  }

  static anyToProfileStats(stats: any): ProfileStats {
    return {
      total_orders: stats.total_orders || 0,
      total_reviews: stats.total_reviews || 0,
      loyalty_points: stats.loyalty_points || 0,
      total_spent: stats.total_spent || 0,
      member_since: TypesMapper.toGrpcTimestamp(stats.member_since)
    }
  }

  static anyToGrpcUserStatistic(stat: any): GrpcUserStatistics {
    return {
      total_users: stat.total_users || 0,
      active_users: stat.active_users || 0,
      new_users_this_month: stat.new_users_this_month || 0,
      users_by_role: stat.users_by_role || {},
      users_by_status: stat.users_by_status || {},
      average_session_duration: stat.average_session_duration || 0,
      verified_users: stat.verified_users || 0,
      unverified_users: stat.unverified_users || 0,
    }
  }
}
