
import { UserRole } from 'src/common/enums/user/roles.enum';
import { Location } from './location.entity';
import { PaymentMethod } from './payment_method.entity';
import { Exclude } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { UserStatus } from 'src/common/enums/user/status.enum';

export class User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  hashed_pwd?: string;
  farm_id?: string;
  gender: string;
  avatar?: string;
  birthday?: Date;
  role: UserRole;
  points: number;
  status: UserStatus;
  locations?: Location[];
  payment_methods?: PaymentMethod[];
  created_at: Date;
  updated_at: Date;
}
