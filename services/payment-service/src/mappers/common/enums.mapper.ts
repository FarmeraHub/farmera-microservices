import { NotificationChannel as GrpcNotificationChannel, NotificationType as GrpcNotificationType, PushMessageType as GrpcPushMessageType } from "@farmera/grpc-proto/dist/common/enums";
import { NotificationChannel } from "src/grpc/client/notification/enums/channel";
import { NotificationType } from "src/grpc/client/notification/enums/notification_type";
import { PushMessageType } from "src/grpc/client/notification/enums/push";

export class EnumsMapper {

    static toGrpcNotificationChannel(value: NotificationChannel): GrpcNotificationChannel {
        switch (value) {
            case NotificationChannel.EMAIL: return GrpcNotificationChannel.EMAIL;
            case NotificationChannel.PUSH: return GrpcNotificationChannel.PUSH;
            default: return GrpcNotificationChannel.CHANNEL_UNSPECIFIED;
        }
    }

    static fromGrpcNotificationChannel(value: GrpcNotificationChannel | undefined): NotificationChannel {
        if (!value) return NotificationChannel.CHANNEL_UNSPECIFIED;
        switch (value.toString()) {
            case "EMAIL": return NotificationChannel.EMAIL;
            case "PUSH": return NotificationChannel.PUSH;
            default: return NotificationChannel.CHANNEL_UNSPECIFIED;
        }
    }

    static toGrpcNotificationType(value: NotificationType): GrpcNotificationType {
        switch (value) {
            case NotificationType.TRANSACTIONAL: return GrpcNotificationType.TRANSACTIONAL;
            case NotificationType.SYSTEM_ALERT: return GrpcNotificationType.SYSTEM_ALERT;
            case NotificationType.CHAT: return GrpcNotificationType.CHAT;
            default: return GrpcNotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        }
    }

    static fromGrpcNotificationType(value: GrpcNotificationType | undefined): NotificationType {
        if (!value) return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        switch (value.toString()) {
            case "TRANSACTIONAL": return NotificationType.TRANSACTIONAL;
            case "SYSTEM_ALERT": return NotificationType.SYSTEM_ALERT;
            case "CHAT": return NotificationType.CHAT;
            default: return NotificationType.NOTIFICATION_TYPE_UNSPECIFIED;
        }
    }

    static toGrpcPushMessageType(value: PushMessageType): GrpcPushMessageType {
        switch (value) {
            case PushMessageType.TOKEN: return GrpcPushMessageType.TOKEN;
            case PushMessageType.TOPIC: return GrpcPushMessageType.TOPIC;
            case PushMessageType.CONDITION: return GrpcPushMessageType.CONDITION;
            default: return GrpcPushMessageType.PUSH_MESSAGE_TYPE_UNSPECIFIED;
        }
    }

    static fromGrpcPushMessageType(value: GrpcPushMessageType | undefined): PushMessageType {
        if (!value) return PushMessageType.PUSH_MESSAGE_TYPE_UNSPECIFIED;
        switch (value.toString()) {
            case "TOKEN": return PushMessageType.TOKEN;
            case "TOPIC": return PushMessageType.TOPIC;
            case "CONDITION": return PushMessageType.CONDITION;
            default: return PushMessageType.PUSH_MESSAGE_TYPE_UNSPECIFIED;
        }
    }
}