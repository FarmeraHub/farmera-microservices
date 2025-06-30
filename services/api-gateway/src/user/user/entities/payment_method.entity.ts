import { PaymentProvider } from 'src/common/enums/user/payment_method.enum';
import { User } from './user.entity';

export class PaymentMethod {
  payment_method_id: number;
  provider: PaymentProvider;
  external_id: string;
  last_four: string;
  card_type: string;
  expiry_date: string;
  cardholder_name: string;
  billing_address: string;
  token: string;
  is_default: boolean;
  user?: User;
  user_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
