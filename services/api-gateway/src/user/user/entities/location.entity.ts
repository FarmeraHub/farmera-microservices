import { User } from "./user.entity";

export class Location {
  location_id: number;
  name: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  address_line: string;
  type: string;
  is_primary: boolean;
  user?: User;
  user_id?: string;
  created_at: Date;
  updated_at: Date;
}
