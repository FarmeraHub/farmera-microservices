import { User } from '../../users/entities/user.entity';
import { Location } from '../../users/entities/location.entity';
import { PaymentMethod } from '../../users/entities/payment_method.entity';

// Mapper to convert TypeORM User entity to gRPC User message
export class UserMapper {
  static toGrpcUser(user: User): any {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone || '',
      first_name: user.first_name,
      last_name: user.last_name,
      farm_id: user.farm_id?.toString() || '',
      gender: this.mapGender(user.gender),
      avatar_url: user.avatar || '',
      birthday: user.birthday ? this.toGrpcTimestamp(user.birthday) : null,
      role: this.mapUserRole(user.role),
      points: user.points || 0,
      status: this.mapUserStatus(user.status),
      locations: user.locations
        ? user.locations.map((loc) => this.toGrpcLocation(loc))
        : [],
      payment_methods: user.payment_methods
        ? user.payment_methods.map((pm) => this.toGrpcPaymentMethod(pm))
        : [],
      created_at: this.toGrpcTimestamp(user.created_at),
      updated_at: this.toGrpcTimestamp(user.updated_at),
      email_verified: true, // You may want to add this field to your entity
      phone_verified: false, // You may want to add this field to your entity
      last_login: null, // You may want to add this field to your entity
    };
  }

  static toGrpcLocation(location: Location): any {
    return {
      id: location.id.toString(),
      user_id: location.user_id.toString(),
      address_line: location.address_line || '',
      city: location.city,
      state: location.district, // Mapping district to state
      postal_code: '', // You may want to add this field
      country: 'Vietnam', // Default or add to entity
      latitude: 0, // You may want to add coordinates
      longitude: 0,
      is_default: location.is_primary,
      created_at: this.toGrpcTimestamp(location.created_at),
      updated_at: this.toGrpcTimestamp(location.updated_at),
    };
  }

  static toGrpcPaymentMethod(paymentMethod: PaymentMethod): any {
    return {
      id: paymentMethod.id.toString(),
      user_id: paymentMethod.user_id.toString(),
      type: this.mapPaymentMethodType(paymentMethod.provider),
      display_name: paymentMethod.cardholder_name || 'Payment Method',
      last_four_digits: paymentMethod.last_four || '',
      provider: paymentMethod.provider,
      is_default: paymentMethod.is_default,
      expires_at: paymentMethod.expiry_date
        ? this.parseExpiryToTimestamp(paymentMethod.expiry_date)
        : null,
      created_at: this.toGrpcTimestamp(paymentMethod.created_at),
      updated_at: this.toGrpcTimestamp(paymentMethod.updated_at),
      metadata: paymentMethod.metadata
        ? JSON.parse(paymentMethod.metadata)
        : {},
    };
  }

  static toGrpcTimestamp(date: Date): any {
    if (!date) return null;
    return {
      value: {
        seconds: Math.floor(date.getTime() / 1000),
        nanos: (date.getTime() % 1000) * 1000000,
      },
    };
  }

  static fromGrpcTimestamp(timestamp: any): Date {
    if (!timestamp?.value) return new Date();
    return new Date(
      timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
    );
  }

  private static mapGender(gender: string): number {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 1;
      case 'female':
        return 2;
      case 'other':
        return 3;
      default:
        return 0; // GENDER_UNSPECIFIED
    }
  }

  private static mapUserRole(role: string): number {
    switch (role?.toLowerCase()) {
      case 'buyer':
        return 1;
      case 'farmer':
        return 2;
      case 'admin':
        return 3;
      default:
        return 0; // USER_ROLE_UNSPECIFIED
    }
  }

  private static mapUserStatus(status: string): number {
    switch (status?.toLowerCase()) {
      case 'active':
        return 1;
      case 'inactive':
        return 2;
      case 'banned':
        return 3;
      default:
        return 0; // USER_STATUS_UNSPECIFIED
    }
  }

  private static mapPaymentMethodType(provider: string): number {
    switch (provider?.toLowerCase()) {
      case 'visa':
        return 1;
      case 'mastercard':
        return 2;
      case 'paypal':
        return 3;
      case 'bank_transfer':
        return 4;
      case 'cash':
        return 5;
      default:
        return 0; // PAYMENT_METHOD_UNSPECIFIED
    }
  }

  private static parseExpiryToTimestamp(expiry: string): any {
    try {
      // Assuming expiry is in MM/YY format
      const [month, year] = expiry.split('/');
      const fullYear = parseInt('20' + year);
      const expiryDate = new Date(fullYear, parseInt(month) - 1, 1);
      return this.toGrpcTimestamp(expiryDate);
    } catch {
      return null;
    }
  }

  // Helper method to create pagination response
  static createPaginationResponse(
    total: number,
    page: number,
    limit: number,
  ): any {
    return {
      total_items: total,
      total_pages: Math.ceil(total / limit),
      current_page: page,
      page_size: limit,
      has_next_page: page * limit < total,
      has_previous_page: page > 1,
    };
  }

  // Helper method to create token info
  static createTokenInfo(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): any {
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: 'Bearer',
      scopes: ['read', 'write'], // Define appropriate scopes
    };
  }
}
