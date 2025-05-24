import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../../enums/roles.enum';

// Base gRPC request interfaces matching the proto definitions
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
  device_info?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  gender?: string;
  birthday?: any; // Timestamp from protobuf
  send_verification_email?: boolean;
}

export interface GetUserRequest {
  user_id: string;
  include_locations?: boolean;
  include_payment_methods?: boolean;
}

export interface UpdateUserRequest {
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  avatar_url?: string;
  birthday?: any; // Timestamp from protobuf
  custom_fields?: { [key: string]: string };
}

export interface DeleteUserRequest {
  user_id: string;
  reason?: string;
  hard_delete?: boolean;
}

export interface ListUsersRequest {
  pagination?: {
    page?: number;
    limit?: number;
    offset?: number;
  };
  sort?: string;
  role_filter?: UserRole;
  status_filter?: string;
  search_query?: string;
  created_date_range?: {
    start_time?: any;
    end_time?: any;
  };
}

export interface SendVerificationEmailRequest {
  user_id?: string;
  email?: string;
}

export interface VerifyEmailRequest {
  user_id: string;
  verification_code?: string;
  verification_token?: string;
}

export interface AddUserLocationRequest {
  user_id: string;
  location: {
    address_line: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
  };
}

export interface AddPaymentMethodRequest {
  user_id: string;
  payment_method: {
    type: string;
    display_name: string;
    last_four_digits?: string;
    provider: string;
    is_default?: boolean;
    expires_at?: any;
    metadata?: { [key: string]: string };
  };
}

export interface UpdateUserStatusRequest {
  user_id: string;
  status: string;
  reason?: string;
  admin_id: string;
}

export interface GetUserStatsRequest {
  date_range?: {
    start_time?: any;
    end_time?: any;
  };
  role_filter?: UserRole;
}
