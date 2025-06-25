import {
    Gender as GrpcGender,
    UserRole as GrpcUserRole,
    UserStatus as GrpcUserStatus,
    PaymentProvider as GrpcPaymentProvider,
} from '@farmera/grpc-proto/dist/common/enums';
import { UserRole } from 'src/enums/roles.enum';
import { UserStatus } from 'src/enums/status.enum';
import { PaymentProvider } from 'src/enums/payment_method.enum';
import { Gender } from 'src/enums/gender.enum';

export class EnumsMapper {

    static toGrpcGender(gender: Gender): GrpcGender {
        switch (gender) {
            case Gender.MALE:
                return GrpcGender.GENDER_MALE;
            case Gender.FEMALE:
                return GrpcGender.GENDER_FEMALE;
            default:
                return GrpcGender.GENDER_UNSPECIFIED;
        }
    }

    static toGrpcUserRole(role: UserRole): GrpcUserRole {
        switch (role) {
            case UserRole.BUYER:
                return GrpcUserRole.USER_ROLE_BUYER;
            case UserRole.FARMER:
                return GrpcUserRole.USER_ROLE_FARMER;
            case UserRole.ADMIN:
                return GrpcUserRole.USER_ROLE_ADMIN;
            default:
                return GrpcUserRole.USER_ROLE_UNSPECIFIED; // USER_ROLE_UNSPECIFIED
        }
    }

    static toGrpcUserStatus(status: UserStatus): GrpcUserStatus {
        switch (status) {
            case UserStatus.ACTIVE:
                return GrpcUserStatus.USER_STATUS_ACTIVE;
            case UserStatus.INACTIVE:
                return GrpcUserStatus.USER_STATUS_INACTIVE;
            case UserStatus.BANNED:
                return GrpcUserStatus.USER_STATUS_BANNED;
            case UserStatus.PENDING_VERIFICATION:
                return GrpcUserStatus.USER_STATUS_PENDING_VERIFICATION;
            case UserStatus.SUSPENDED:
                return GrpcUserStatus.USER_STATUS_SUSPENDED;
            default:
                return GrpcUserStatus.USER_STATUS_UNSPECIFIED; // USER_STATUS_UNSPECIFIED
        }
    }

    static toGrpcPaymentProvider(provider: PaymentProvider): GrpcPaymentProvider {
        switch (provider) {
            case PaymentProvider.VNPAY:
                return GrpcPaymentProvider.PAYMENT_PROVIDER_VNPAY;
            case PaymentProvider.MOMO:
                return GrpcPaymentProvider.PAYMENT_PROVIDER_MOMO;
            case PaymentProvider.ZALOPAY:
                return GrpcPaymentProvider.PAYMENT_PROVIDER_ZALOPAY;
            case PaymentProvider.OTHER:
                return GrpcPaymentProvider.PAYMENT_PROVIDER_OTHER;
            default:
                return GrpcPaymentProvider.PAYMENT_PROVIDER_UNSPECIFIED; // PAYMENT_METHOD_UNSPECIFIED
        }
    }

    static fromGrpcPaymentProvider(provider: GrpcPaymentProvider): PaymentProvider {
        switch (provider.toString()) {
            case "PAYMENT_PROVIDER_VNPAY":
                return PaymentProvider.VNPAY;
            case "PAYMENT_PROVIDER_MOMO":
                return PaymentProvider.MOMO;
            case "PAYMENT_PROVIDER_ZALOPAY":
                return PaymentProvider.ZALOPAY;
            default:
                return PaymentProvider.OTHER;
        }
    }

    static fromGrpcUserRole(grpcRole: GrpcUserRole): UserRole {
        switch (grpcRole.toString()) {
            case "USER_ROLE_BUYER":
                return UserRole.BUYER;
            case "USER_ROLE_FARMER":
                return UserRole.FARMER;
            case "USER_ROLE_ADMIN":
                return UserRole.ADMIN;
            default:
                throw new Error(`Unsupported gRPC user role: ${grpcRole}`);
        }
    }

    static fromGrpcUserStatus(grpcStatus: GrpcUserStatus): UserStatus {
        switch (grpcStatus.toString()) {
            case "USER_STATUS_ACTIVE":
                return UserStatus.ACTIVE;
            case "USER_STATUS_INACTIVE":
                return UserStatus.INACTIVE;
            case "USER_STATUS_BANNED":
                return UserStatus.BANNED;
            case "USER_STATUS_PENDING_VERIFICATION":
                return UserStatus.PENDING_VERIFICATION;
            case "USER_STATUS_SUSPENDED":
                return UserStatus.SUSPENDED;
            default:
                throw new Error(`Unsupported gRPC user status: ${grpcStatus}`);
        }
    }

    static fromGrpcGender(grpcGender: GrpcGender): Gender {
        switch (grpcGender.toString()) {
            case "GENDER_MALE":
                return Gender.MALE;
            case "GENDER_FEMALE":
                return Gender.FEMALE;
            default:
                return Gender.UNSPECIFIED;
        }
    }
}