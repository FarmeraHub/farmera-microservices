// Import the UserRole and UserStatus enums from users service
export enum UserRole {
  BUYER = 'buyer',
  FARMER = 'farmer',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * Interface representing a user from the JWT payload
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  sub?: string; // JWT subject field
  iat?: number; // JWT issued at timestamp
  exp?: number; // JWT expiration timestamp
}
