/**
 * Interface representing a user from the JWT payload
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  sub?: string; // JWT subject field
  iat?: number; // JWT issued at timestamp
  exp?: number; // JWT expiration timestamp
}
