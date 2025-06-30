import { PaymentMethod } from "./payment_method.entity";
import { Gender } from "src/common/enums/user/gender.enum";
import { Location } from "./location.entity";
import { UserRole } from "src/common/enums/user/roles.enum";
import { UserStatus } from "src/common/enums/user/status.enum";

export class User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  farm_id?: string;
  gender: Gender;
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
