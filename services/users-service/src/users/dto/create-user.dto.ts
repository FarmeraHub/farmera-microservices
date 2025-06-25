import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDate,
  IsBoolean,
  MinLength,
  MaxLength,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';
import { PaymentProvider } from 'src/enums/payment_method.enum';
import { Gender } from 'src/enums/gender.enum';
import { CreateLocationDto } from './location.dto';
import { CreatePaymentMethodDto as PaymentMethodDTO } from './payment-method.dto';

// Re-export for backward compatibility
export { CreateLocationDto } from './location.dto';

// Moved to separate file: ./payment-method.dto.ts
// Re-export for backward compatibility
export { CreatePaymentMethodDto } from './payment-method.dto';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and hyphens',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  password: string;

  @IsNumber()
  @IsOptional()
  farm_id?: number;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  birthday?: Date;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateLocationDto)
  locations?: CreateLocationDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDTO)
  payment_methods?: PaymentMethodDTO[];
}

export class CreateUserSignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  password: string;

  @IsNotEmpty()
  code: string;
}
