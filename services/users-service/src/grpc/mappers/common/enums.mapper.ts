import {
    Gender as GrpcGender,
    UserRole as GrpcUserRole,
    UserStatus as GrpcUserStatus,
    PaymentMethod as GrpcPaymentMethod
} from '@farmera/grpc-proto/dist/common/enums';
import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';

export class EnumsMapper {

    static toGrpcGender(gender: string): GrpcGender {
        switch (gender?.toLowerCase()) {
            case 'male':
                return GrpcGender.GENDER_MALE;
            case 'female':
                return GrpcGender.GENDER_FEMALE;
            case 'other':
                return GrpcGender.GENDER_OTHER;
            default:
                return GrpcGender.GENDER_UNSPECIFIED; // GENDER_UNSPECIFIED
        }
    }

    static toGrpcUserRole(role: string): GrpcUserRole {
        switch (role?.toLowerCase()) {
            case 'buyer':
                return GrpcUserRole.USER_ROLE_CUSTOMER;
            case 'farmer':
                return GrpcUserRole.USER_ROLE_FARMER;
            case 'admin':
                return GrpcUserRole.USER_ROLE_ADMIN;
            default:
                return GrpcUserRole.USER_ROLE_UNSPECIFIED; // USER_ROLE_UNSPECIFIED
        }
    }

    static toGrpcUserStatus(status: string): GrpcUserStatus {
        switch (status?.toLowerCase()) {
            case 'active':
                return GrpcUserStatus.USER_STATUS_ACTIVE;
            case 'inactive':
                return GrpcUserStatus.USER_STATUS_INACTIVE;
            case 'banned':
                return GrpcUserStatus.USER_STATUS_BANNED;
            default:
                return GrpcUserStatus.USER_STATUS_UNSPECIFIED; // USER_STATUS_UNSPECIFIED
        }
    }

    static toGrpcPaymentMethodType(provider: string): GrpcPaymentMethod {
        switch (provider?.toLowerCase()) {
            case 'visa':
                return GrpcPaymentMethod.PAYMENT_METHOD_VISA;
            case 'mastercard':
                return GrpcPaymentMethod.PAYMENT_METHOD_MASTER_CARD;
            case 'paypal':
                return GrpcPaymentMethod.PAYMENT_METHOD_PAYPAL;
            case 'bank_transfer':
                return GrpcPaymentMethod.PAYMENT_METHOD_BANK_TRANSFER;
            case 'cash':
                return GrpcPaymentMethod.PAYMENT_METHOD_CASH;
            default:
                return GrpcPaymentMethod.PAYMENT_METHOD_UNSPECIFIED; // PAYMENT_METHOD_UNSPECIFIED
        }
    }

    static fromGrpcPaymentMethodType(method: GrpcPaymentMethod): string {
        switch (method) {
            case GrpcPaymentMethod.PAYMENT_METHOD_VISA:
                return 'visa';
            case GrpcPaymentMethod.PAYMENT_METHOD_MASTER_CARD:
                return 'mastercard';
            case GrpcPaymentMethod.PAYMENT_METHOD_PAYPAL:
                return 'paypal';
            case GrpcPaymentMethod.PAYMENT_METHOD_BANK_TRANSFER:
                return 'bank_transfer';
            case GrpcPaymentMethod.PAYMENT_METHOD_CASH:
                return 'cash';
            default:
                return 'unspecified';
        }
    }
    static fromGrpcUserRole(grpcRole: GrpcUserRole): UserRole {
        switch (grpcRole) {
            case GrpcUserRole.USER_ROLE_CUSTOMER:
                return UserRole.BUYER;
            case GrpcUserRole.USER_ROLE_FARMER:
                return UserRole.FARMER;
            case GrpcUserRole.USER_ROLE_ADMIN:
                return UserRole.ADMIN;
            default:
                throw new Error(`Unsupported gRPC user role: ${grpcRole}`);
        }
    }

    static fromGrpcUserStatus(grpcStatus: GrpcUserStatus): UserStatus {
        switch (grpcStatus) {
            case GrpcUserStatus.USER_STATUS_ACTIVE:
                return UserStatus.ACTIVE;
            case GrpcUserStatus.USER_STATUS_INACTIVE:
                return UserStatus.INACTIVE;
            case GrpcUserStatus.USER_STATUS_BANNED:
                return UserStatus.BANNED;
            default:
                throw new Error(`Unsupported gRPC user status: ${grpcStatus}`);
        }
    }


}