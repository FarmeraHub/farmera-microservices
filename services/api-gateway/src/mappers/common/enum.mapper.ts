import {
  FarmStatus as GrpcFarmStatus,
  MessageType as GrpcMessageType,
  IdentificationStatus as GrpcIdentificationStatus,
  IdentificationMethod as GrpcIdentificationMethod,
  ProductStatus as GrpcProductStatus,
  PaginationOrder,
  ProcessStage as GrpcProcessStage,
  Gender as GrpcGender,
  UserRole as GrpcUserRole,
  UserStatus as GrpcUserStatus,
  PaymentProvider as GrpcPaymentProvider,
  NotificationChannel as GrpcNotificationChannel,
  NotificationType as GrpcNotificationType,
  OrderStatus as GrpcOrderStatus,
  SubOrderStatus as GrpcSubOrderStatus,
  PaymentStatus as GrpcPaymentStatus,
  PaymentMethod as GrpcPaymentMethod,
  DeliveryStatus as GrpcDeliveryStatus,
  DiaryCompletionStatus as GrpcDiaryCompletionStatus,
  AssignmentStatus as GrpcAssignmentStatus,
} from '@farmera/grpc-proto/dist/common/enums';
import { MessageType } from 'src/communication/enums/message-type.enums';
import { FarmStatus } from 'src/common/enums/product/farm-status.enum';
import { ProductStatus } from 'src/common/enums/product/product-status.enum';
import {
  IdentificationMethod,
  IdentificationStatus,
} from 'src/product/farm/entities/identification.entity';
import { Order } from 'src/pagination/dto/pagination-options.dto';
import { ProcessStage } from 'src/common/enums/product/process-stage.enum';
import { BadRequestException } from '@nestjs/common';
import { NotificationChannel } from 'src/common/enums/notification/notification-channel.enum';
import { NotificationType } from 'src/common/enums/notification/notification_type';
import { Gender } from 'src/common/enums/user/gender.enum';
import { UserRole } from "src/common/interfaces/user.interface";
import { UserStatus } from 'src/common/enums/user/status.enum';
import { PaymentProvider } from 'src/common/enums/user/payment_method.enum';
import { OrderStatus } from 'src/common/enums/payment/order-status.enum';
import { SubOrderStatus } from 'src/common/enums/payment/sub-order-status.enum';
import { PaymentMethod, PaymentStatus } from 'src/common/enums/payment/payment.enum';
import { DeliveryStatus } from 'src/common/enums/payment/delivery.enum';
import { AssignmentStatus } from 'src/common/enums/product/process-assignment-status';
import { DiaryCompletionStatus } from 'src/common/enums/product/diary-completion-status';

export class EnumMapper {
  static fromGrpcIdentificationMethod(
    value: GrpcIdentificationMethod,
  ): IdentificationMethod {
    switch (value.toString()) {
      case 'IDENTIFICATION_METHOD_BIOMETRIC':
        return IdentificationMethod.BIOMETRIC;
      case 'IDENTIFICATION_METHOD_ID_CARD':
        return IdentificationMethod.ID_CARD;
      case 'IDENTIFICATION_METHOD_PASSPORT':
        return IdentificationMethod.PASSPORT;
      default:
        return IdentificationMethod.UNSPECIFIED;
    }
  }

  static fromGrpcIdentificationStatus(
    value: GrpcIdentificationStatus,
  ): IdentificationStatus {
    switch (value.toString()) {
      case 'IDENTIFICATION_STATUS_PENDING':
        return IdentificationStatus.PENDING;
      case 'IDENTIFICATION_STATUS_APPROVED':
        return IdentificationStatus.APPROVED;
      case 'IDENTIFICATION_STATUS_REJECTED':
        return IdentificationStatus.REJECTED;
      default:
        return IdentificationStatus.UNSPECIFIED;
    }
  }

  static fromGrpcMessageType(
    value: GrpcMessageType | undefined,
  ): MessageType | undefined {
    if (!value) return undefined;
    switch (value.toString()) {
      case 'MEDIA':
        return MessageType.MEDIA;
      case 'MESSAGE':
        return MessageType.MESSAGE;
      default:
        return MessageType.MESSAGE_TYPE_UNSPECIFIED;
    }
  }

  static fromGrpcFarmStatus(value: GrpcFarmStatus): FarmStatus {
    switch (value.toString()) {
      case 'FARM_STATUS_PENDING':
        return FarmStatus.PENDING;
      case 'FARM_STATUS_VERIFIED':
        return FarmStatus.VERIFIED;
      case 'FARM_STATUS_APPROVED':
        return FarmStatus.APPROVED;
      case 'FARM_STATUS_BLOCKED':
        return FarmStatus.BLOCKED;
      case 'FARM_STATUS_REJECTED':
        return FarmStatus.REJECTED;
      default:
        return FarmStatus.UNSPECIFIED;
    }
  }

  static fromGrpcProductStatus(value: GrpcProductStatus): ProductStatus {
    switch (value.toString()) {
      case 'PRODUCT_STATUS_PRE_ORDER':
        return ProductStatus.PRE_ORDER;
      case 'PRODUCT_STATUS_NOT_YET_OPEN':
        return ProductStatus.NOT_YET_OPEN;
      case 'PRODUCT_STATUS_OPEN_FOR_SALE':
        return ProductStatus.OPEN_FOR_SALE;
      case 'PRODUCT_STATUS_SOLD_OUT':
        return ProductStatus.SOLD_OUT;
      case 'PRODUCT_STATUS_CLOSED':
        return ProductStatus.CLOSED;
      case 'PRODUCT_STATUS_DELETED':
        return ProductStatus.DELETED;
      default:
        return ProductStatus.UNSPECIFIED;
    }
  }

  static toGrpcSortOrder(value: Order): PaginationOrder | undefined {
    if (!value) return undefined;
    switch (value) {
      case Order.ASC:
        return PaginationOrder.ASC;
      case Order.DESC:
        return PaginationOrder.DESC;
      default:
        return PaginationOrder.ORDER_UNSPECIFIED;
    }
  }

  static toGrpcProductStatus(
    status: ProductStatus,
  ): GrpcProductStatus | undefined {
    if (!status) return undefined;
    switch (status) {
      case ProductStatus.PRE_ORDER:
        return GrpcProductStatus.PRODUCT_STATUS_PRE_ORDER;
      case ProductStatus.NOT_YET_OPEN:
        return GrpcProductStatus.PRODUCT_STATUS_NOT_YET_OPEN;
      case ProductStatus.OPEN_FOR_SALE:
        return GrpcProductStatus.PRODUCT_STATUS_OPEN_FOR_SALE;
      case ProductStatus.SOLD_OUT:
        return GrpcProductStatus.PRODUCT_STATUS_SOLD_OUT;
      case ProductStatus.CLOSED:
        return GrpcProductStatus.PRODUCT_STATUS_CLOSED;
      case ProductStatus.DELETED:
        return GrpcProductStatus.PRODUCT_STATUS_DELETED;
      default:
        return GrpcProductStatus.PRODUCT_STATUS_UNSPECIFIED;
    }
  }

  static toGrpcProcessStage(stage: ProcessStage): GrpcProcessStage | undefined {
    if (!stage) return undefined;
    switch (stage) {
      case ProcessStage.START:
        return GrpcProcessStage.PROCESS_STAGE_START;
      case ProcessStage.PRODUCTION:
        return GrpcProcessStage.PROCESS_STAGE_PRODUCTION;
      case ProcessStage.COMPLETION:
        return GrpcProcessStage.PROCESS_STAGE_COMPLETION;
      default:
        return GrpcProcessStage.PROCESS_STAGE_UNSPECIFIED;
    }
  }

  static fromGrpcProcessStage(value: GrpcProcessStage): ProcessStage {
    switch (value.toString()) {
      case 'PROCESS_STAGE_START':
        return ProcessStage.START;
      case 'PROCESS_STAGE_PRODUCTION':
        return ProcessStage.PRODUCTION;
      case 'PROCESS_STAGE_COMPLETION':
        return ProcessStage.COMPLETION;
      default:
        throw new BadRequestException('Invalid process stage');
    }
  }

  static toGrpcNotificationChannel(
    value: NotificationChannel,
  ): GrpcNotificationChannel {
    if (!value) return undefined;
    switch (value) {
      case NotificationChannel.EMAIL:
        return GrpcNotificationChannel.EMAIL;
      case NotificationChannel.PUSH:
        return GrpcNotificationChannel.PUSH;
      default:
        return GrpcNotificationChannel.CHANNEL_UNSPECIFIED;
    }
  }

  static fromGrpcNotificationChannel(
    value: GrpcNotificationChannel,
  ): NotificationChannel {
    switch (value.toString()) {
      case 'EMAIL':
        return NotificationChannel.EMAIL;
      case 'PUSH':
        return NotificationChannel.PUSH;
      default:
        throw new BadRequestException('Invalid Notification Channel');
    }
  }

  static toGrpcNotificationType(value: NotificationType): GrpcNotificationType {
    switch (value) {
      case NotificationType.TRANSACTIONAL:
        return GrpcNotificationType.TRANSACTIONAL;
      case NotificationType.SYSTEM_ALERT:
        return GrpcNotificationType.SYSTEM_ALERT;
      case NotificationType.CHAT:
        return GrpcNotificationType.CHAT;
      default:
        return GrpcNotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
    }
  }

  static fromGrpcNotificationType(
    value: GrpcNotificationType | undefined,
  ): NotificationType {
    if (!value) return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
    switch (value.toString()) {
      case 'TRANSACTIONAL':
        return NotificationType.TRANSACTIONAL;
      case 'SYSTEM_ALERT':
        return NotificationType.SYSTEM_ALERT;
      case 'CHAT':
        return NotificationType.CHAT;
      default:
        return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
    }
  }

  static toGrpcGender(value: Gender): GrpcGender {
    switch (value) {
      case Gender.MALE:
        return GrpcGender.GENDER_MALE;
      case Gender.FEMALE:
        return GrpcGender.GENDER_FEMALE;
      default:
        return GrpcGender.GENDER_UNSPECIFIED;
    }
  }

  static fromGrpcGender(value: GrpcGender): Gender {
    switch (value.toString()) {
      case 'GENDER_MALE':
        return Gender.MALE;
      case 'GENDER_FEMALE':
        return Gender.FEMALE;
      default:
        return Gender.UNSPECIFIED;
    }
  }

  static fromGrpcUserRole(value: GrpcUserRole): UserRole {
    switch (value.toString()) {
      case 'USER_ROLE_BUYER':
        return UserRole.BUYER;
      case 'USER_ROLE_FARMER':
        return UserRole.FARMER;
      case 'USER_ROLE_ADMIN':
        return UserRole.ADMIN;
      default:
        throw new BadRequestException('Invalid user role');
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
        return GrpcUserRole.USER_ROLE_UNSPECIFIED;
    }
  }

  static toGrpcUserStatus(value: UserStatus): GrpcUserStatus {
    switch (value) {
      case UserStatus.ACTIVE: return GrpcUserStatus.USER_STATUS_ACTIVE;
      case UserStatus.BANNED: return GrpcUserStatus.USER_STATUS_BANNED;
      case UserStatus.INACTIVE: return GrpcUserStatus.USER_STATUS_INACTIVE;
      case UserStatus.PENDING_VERIFICATION: return GrpcUserStatus.USER_STATUS_PENDING_VERIFICATION;
      case UserStatus.SUSPENDED: return GrpcUserStatus.USER_STATUS_SUSPENDED;
      default: return GrpcUserStatus.USER_STATUS_UNSPECIFIED;
    }
  }

  static fromGrpcUserStatus(grpcStatus: GrpcUserStatus): UserStatus {
    switch (grpcStatus.toString()) {
      case 'USER_STATUS_ACTIVE':
        return UserStatus.ACTIVE;
      case 'USER_STATUS_INACTIVE':
        return UserStatus.INACTIVE;
      case 'USER_STATUS_BANNED':
        return UserStatus.BANNED;
      case 'USER_STATUS_PENDING_VERIFICATION':
        return UserStatus.PENDING_VERIFICATION;
      case 'USER_STATUS_SUSPENDED':
        return UserStatus.SUSPENDED;
      default:
        throw new Error(`Unsupported gRPC user status: ${grpcStatus}`);
    }
  }

  static toGrpcPaymentProvider(value: PaymentProvider): GrpcPaymentProvider {
    switch (value) {
      case PaymentProvider.VNPAY:
        return GrpcPaymentProvider.PAYMENT_PROVIDER_VNPAY;
      case PaymentProvider.MOMO:
        return GrpcPaymentProvider.PAYMENT_PROVIDER_MOMO;
      case PaymentProvider.ZALOPAY:
        return GrpcPaymentProvider.PAYMENT_PROVIDER_ZALOPAY;
      case PaymentProvider.OTHER:
        return GrpcPaymentProvider.PAYMENT_PROVIDER_OTHER;
      default:
        return GrpcPaymentProvider.PAYMENT_PROVIDER_UNSPECIFIED;
    }
  }


  static fromGrpcPaymentProvider(value: GrpcPaymentProvider): PaymentProvider {
    switch (value.toString()) {
      case 'PAYMENT_PROVIDER_VNPAY':
        return PaymentProvider.VNPAY;
      case 'PAYMENT_PROVIDER_MOMO':
        return PaymentProvider.MOMO;
      case 'PAYMENT_PROVIDER_ZALOPAY':
        return PaymentProvider.ZALOPAY;
      case 'PAYMENT_PROVIDER_OTHER':
        return PaymentProvider.OTHER;
      default:
        throw new BadRequestException('Invalid payment provider');
    }
  }

  static fromGrpcOrderStatus(value: GrpcOrderStatus): OrderStatus {
    switch (value.toString()) {
      case 'ORDER_STATUS_PENDING':
        return OrderStatus.PENDING;
      case 'ORDER_STATUS_PROCESSING':
        return OrderStatus.PROCESSING;
      case 'ORDER_STATUS_PAID':
        return OrderStatus.PAID;
      case 'ORDER_STATUS_SHIPPED':
        return OrderStatus.SHIPPED;
      case 'ORDER_STATUS_DELIVERED':
        return OrderStatus.DELIVERED;
      case 'ORDER_STATUS_CANCELED':
        return OrderStatus.CANCELED;
      case 'ORDER_STATUS_RETURNED':
        return OrderStatus.RETURNED;
      case 'ORDER_STATUS_FAILED':
        return OrderStatus.FAILED;
      default:
        throw new BadRequestException('Invalid order status');
    }
  }
  static toGrpcOrderStatus(value: OrderStatus): GrpcOrderStatus {
    switch (value) {
      case OrderStatus.PENDING:
        return GrpcOrderStatus.ORDER_STATUS_PENDING;
      case OrderStatus.PROCESSING:
        return GrpcOrderStatus.ORDER_STATUS_PROCESSING;
      case OrderStatus.PAID:
        return GrpcOrderStatus.ORDER_STATUS_PAID;
      case OrderStatus.SHIPPED:
        return GrpcOrderStatus.ORDER_STATUS_SHIPPED;
      case OrderStatus.DELIVERED:
        return GrpcOrderStatus.ORDER_STATUS_DELIVERED;
      case OrderStatus.CANCELED:
        return GrpcOrderStatus.ORDER_STATUS_CANCELED;
      case OrderStatus.RETURNED:
        return GrpcOrderStatus.ORDER_STATUS_RETURNED;
      case OrderStatus.FAILED:
        return GrpcOrderStatus.ORDER_STATUS_FAILED;
      default:
        return GrpcOrderStatus.ORDER_STATUS_UNSPECIFIED;
    }
  }

  static fromGrpcSubOrderStatus(value: GrpcSubOrderStatus): SubOrderStatus {
    switch (value.toString()) {
      case 'SUB_ORDER_STATUS_PENDING':
        return SubOrderStatus.PENDING;
      case 'SUB_ORDER_STATUS_CONFIRMED':
        return SubOrderStatus.CONFIRMED;
      case 'SUB_ORDER_STATUS_PROCESSING':
        return SubOrderStatus.PROCESSING;
      case 'SUB_ORDER_STATUS_PAID':
        return SubOrderStatus.PAID;
      case 'SUB_ORDER_STATUS_SHIPPED':
        return SubOrderStatus.SHIPPED;
      case 'SUB_ORDER_STATUS_DELIVERED':
        return SubOrderStatus.DELIVERED;
      case 'SUB_ORDER_STATUS_CANCELED':
        return SubOrderStatus.CANCELED;
      case 'SUB_ORDER_STATUS_RETURNED':
        return SubOrderStatus.RETURNED;
      case 'SUB_ORDER_STATUS_FAILED':
        return SubOrderStatus.FAILED;
      default:
        throw new BadRequestException('Invalid sub-order status');
    }
  }
  static toGrpcSubOrderStatus(value: SubOrderStatus): GrpcSubOrderStatus {
    switch (value) {
      case SubOrderStatus.PENDING:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_PENDING;
      case SubOrderStatus.CONFIRMED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_CONFIRMED;
      case SubOrderStatus.PROCESSING:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_PROCESSING;
      case SubOrderStatus.PAID:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_PAID;
      case SubOrderStatus.SHIPPED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_SHIPPED;
      case SubOrderStatus.DELIVERED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_DELIVERED;
      case SubOrderStatus.CANCELED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_CANCELED;
      case SubOrderStatus.RETURNED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_RETURNED;
      case SubOrderStatus.FAILED:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_FAILED;
      default:
        return GrpcSubOrderStatus.SUB_ORDER_STATUS_UNSPECIFIED;
    }
  }

  static fromGrpcPaymentStatus(value: GrpcPaymentStatus): PaymentStatus {
    switch (value.toString()) {
      case 'PAYMENT_STATUS_PENDING':
        return PaymentStatus.PENDING;
      case 'PAYMENT_STATUS_COMPLETED':
        return PaymentStatus.COMPLETED;
      case 'PAYMENT_STATUS_FAILED':
        return PaymentStatus.FAILED;
      case 'PAYMENT_STATUS_PROCESSING':
        return PaymentStatus.PROCESSING;
      case 'PAYMENT_STATUS_CANCELED':
        return PaymentStatus.CANCELED;
      default:
        throw new BadRequestException('Invalid payment status');
    }
  }
  static toGrpcPaymentStatus(value: PaymentStatus): GrpcPaymentStatus {
    switch (value) {
      case PaymentStatus.PENDING:
        return GrpcPaymentStatus.PAYMENT_STATUS_PENDING;
      case PaymentStatus.COMPLETED:
        return GrpcPaymentStatus.PAYMENT_STATUS_COMPLETED;
      case PaymentStatus.FAILED:
        return GrpcPaymentStatus.PAYMENT_STATUS_FAILED;
      case PaymentStatus.PROCESSING:
        return GrpcPaymentStatus.PAYMENT_STATUS_PROCESSING;
      case PaymentStatus.CANCELED:
        return GrpcPaymentStatus.PAYMENT_STATUS_CANCELED;
      default:
        return GrpcPaymentStatus.PAYMENT_STATUS_UNSPECIFIED;
    }
  }
  static fromGrpcPaymentMethod(value: GrpcPaymentMethod): PaymentMethod {
    switch (value.toString()) {
      case 'PAYMENT_METHOD_COD':
        return PaymentMethod.COD;
      case 'PAYMENT_METHOD_PAYOS':
        return PaymentMethod.PAYOS;
      default:
        throw new BadRequestException('Invalid payment method');
    }
  }
  static toGrpcPaymentMethod(value: PaymentMethod): GrpcPaymentMethod {
    switch (value) {
      case PaymentMethod.COD:
        return GrpcPaymentMethod.PAYMENT_METHOD_COD;
      case PaymentMethod.PAYOS:
        return GrpcPaymentMethod.PAYMENT_METHOD_PAYOS;
      default:
        return GrpcPaymentMethod.PAYMENT_METHOD_UNSPECIFIED;
    }
  }

  static fromGrpcDeliveryStatus(value: GrpcDeliveryStatus): DeliveryStatus {
    switch (value.toString()) {
      case 'DELIVERY_STATUS_PENDING':
        return DeliveryStatus.PENDING;
      case 'DELIVERY_STATUS_PROCESSING':
        return DeliveryStatus.PROCESSING;
      case 'DELIVERY_STATUS_PAID':
        return DeliveryStatus.PAID;
      case 'DELIVERY_STATUS_DELIVERED':
        return DeliveryStatus.DELIVERED;
      case 'DELIVERY_STATUS_CANCELED':
        return DeliveryStatus.CANCELED;
      case 'DELIVERY_STATUS_RETURNED':
        return DeliveryStatus.RETURNED;
      default:
        throw new BadRequestException('Invalid delivery status');
    }
  }
  static toGrpcDeliveryStatus(value: DeliveryStatus): GrpcDeliveryStatus {
    switch (value) {
      case DeliveryStatus.PENDING:
        return GrpcDeliveryStatus.DELIVERY_STATUS_PENDING;
      case DeliveryStatus.PROCESSING:
        return GrpcDeliveryStatus.DELIVERY_STATUS_PROCESSING;
      case DeliveryStatus.PAID:
        return GrpcDeliveryStatus.DELIVERY_STATUS_PAID;
      case DeliveryStatus.DELIVERED:
        return GrpcDeliveryStatus.DELIVERY_STATUS_DELIVERED;
      case DeliveryStatus.CANCELED:
        return GrpcDeliveryStatus.DELIVERY_STATUS_CANCELED;
      case DeliveryStatus.RETURNED:
        return GrpcDeliveryStatus.DELIVERY_STATUS_RETURNED;
      default:
        return GrpcDeliveryStatus.DELIVERY_STATUS_UNSPECIFIED;
    }
  }

  static toGrpcFarmStatus(value: FarmStatus): GrpcFarmStatus | undefined {
    if (!value) return undefined;
    switch (value) {
      case FarmStatus.PENDING: return GrpcFarmStatus.FARM_STATUS_PENDING;
      case FarmStatus.VERIFIED: return GrpcFarmStatus.FARM_STATUS_VERIFIED;
      case FarmStatus.APPROVED: return GrpcFarmStatus.FARM_STATUS_APPROVED;
      case FarmStatus.BLOCKED: return GrpcFarmStatus.FARM_STATUS_BLOCKED;
      case FarmStatus.REJECTED: return GrpcFarmStatus.FARM_STATUS_REJECTED;
      default: return GrpcFarmStatus.FARM_STATUS_UNSPECIFIED;
    }
  }
  static toGrpcAssignmentStatus(value: AssignmentStatus): GrpcAssignmentStatus {
    switch (value) {
      case AssignmentStatus.ACTIVE: return GrpcAssignmentStatus.ASSIGNMENT_ACTIVE;
      case AssignmentStatus.CANCELLED: return GrpcAssignmentStatus.ASSIGNMENT_CANCELLED;
      case AssignmentStatus.UNACTIVATED: return GrpcAssignmentStatus.ASSIGNMENT_UNACTIVATED;
      default: return GrpcAssignmentStatus.UNRECOGNIZED;
    }
  }

  static fromGrpcAssignmentStatus(value: GrpcAssignmentStatus): AssignmentStatus | undefined {
    switch (value.toString()) {
      case "ASSIGNMENT_UNACTIVATED": return AssignmentStatus.UNACTIVATED;
      case "ASSIGNMENT_ACTIVE": return AssignmentStatus.ACTIVE;
      case "ASSIGNMENT_COMPLETED": return AssignmentStatus.COMPLETED;
      case "ASSIGNMENT_CANCELLED": return AssignmentStatus.CANCELLED;
      default: return undefined;
    }
  }

  static toGrpcDiaryCompletionStatus(status: DiaryCompletionStatus): GrpcDiaryCompletionStatus {
    switch (status) {
      case DiaryCompletionStatus.IN_PROGRESS:
        return GrpcDiaryCompletionStatus.IN_PROGRESS;
      case DiaryCompletionStatus.COMPLETED:
        return GrpcDiaryCompletionStatus.COMPLETED;
      case DiaryCompletionStatus.SKIPPED:
        return GrpcDiaryCompletionStatus.SKIPPED;
      default:
        return GrpcDiaryCompletionStatus.COMPLETION_STATUS_UNSPECIFIED;
    }
  }

  static fromGrpcDiaryCompletionStatus(value: GrpcDiaryCompletionStatus): DiaryCompletionStatus | undefined {
    switch (value.toString()) {
      case "IN_PROGRESS": return DiaryCompletionStatus.IN_PROGRESS;
      case "COMPLETED": return DiaryCompletionStatus.COMPLETED;
      case "SKIPPED": return DiaryCompletionStatus.SKIPPED;
      default: return undefined;
    }
  }
}
