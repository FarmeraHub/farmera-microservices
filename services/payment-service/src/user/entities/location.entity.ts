
export class Location {
  id: number;
  user_id: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  district: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}
