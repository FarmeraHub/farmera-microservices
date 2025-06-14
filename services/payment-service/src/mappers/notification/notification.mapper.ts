import { CreateTemplateResponse, GetTemplateResponse, GetUserPreferencesResponse, SendEmailNotificationRequest, SendNotificationRequest, SendPushNotificationRequest } from "@farmera/grpc-proto/dist/notification/notification";
import { Template } from "src/clients/notification/entities/template.entity";
import { TypesMapper } from "../common/types.mapper";
import { UserPreferences } from "src/clients/notification/entities/user_preferences.entity";
import { EnumsMapper } from "../common/enums.mapper";
import { SendPushNotificationDto } from "src/clients/notification/dtos/send-push.dto";
import { SendEmailNotificationDto } from "src/clients/notification/dtos/send-email.dto";
import { SendNotification } from "src/clients/notification/dtos/send-notification.dto";

export class NotificationMapper {
    static fromGrpcGetTemplateResponse(value: GetTemplateResponse): Template {
        return {
            tempate_id: value.template_id,
            name: value.name,
            content: value.content,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated)
        }
    }

    static fromGrpcCreateTemplateResponse(value: CreateTemplateResponse): Template {
        return {
            tempate_id: value.template_id,
            name: value.name,
            content: value.content,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated)
        }
    }

    static fromGrpcGetUserPreferencesResponse(value: GetUserPreferencesResponse): UserPreferences {
        return {
            user_id: value.user_id,
            user_email: value.user_email,
            transaction_channels: value.transactional_channels.map((value) => EnumsMapper.fromGrpcNotificationChannel(value)),
            system_alert_channels: value.system_alert_channels.map((value) => EnumsMapper.fromGrpcNotificationChannel(value)),
            chat_channels: value.chat_channels.map((value) => EnumsMapper.fromGrpcNotificationChannel(value)),
            do_not_disturb_start: value.do_not_disturb_start,
            do_not_disturb_end: value.do_not_disturb_end,
            time_zone: value.time_zone
        }
    }

    static toGrpcSendPushNotificationRequest(value: SendPushNotificationDto): SendPushNotificationRequest {
        return {
            recipient: value.recipient,
            type: EnumsMapper.toGrpcPushMessageType(value.type),
            template_id: value.template_id,
            template_props: TypesMapper.toGrpcStringMap(value.template_props),
            title: value.title,
            content: value.content,
        }
    }

    static toGrpcSendEmailNotificationRequest(value: SendEmailNotificationDto): SendEmailNotificationRequest {
        return {
            to: value.to.map((value) => TypesMapper.toGrpcNotificationEmail(value)),
            from: TypesMapper.toGrpcNotificationEmail(value.from),
            template_id: value.template_id,
            template_props: TypesMapper.toGrpcStringMap(value.template_props),
            subject: value.subject,
            content: value.content,
            content_type: value.content_type,
            attachments:
                value.attachments ?
                    { attachments: value.attachments.map((value) => TypesMapper.toGrpcNotificationAttachment(value)) } :
                    undefined,
            reply_to: value.reply_to ? TypesMapper.toGrpcNotificationEmail(value.reply_to) : undefined,
        }
    }

    static toGrpcSendNotificationRequest(value: SendNotification): SendNotificationRequest {
        return {
            recipent: value.recipient,
            notification_type: EnumsMapper.toGrpcNotificationType(value.notification_type),
            channels: value.channels.map((value) => EnumsMapper.toGrpcNotificationChannel(value)),
            from: TypesMapper.toGrpcNotificationEmail(value.from),
            title: value.title,
            content: value.content,
            content_type: value.content_type,
            template_id: value.template_id,
            template_props: TypesMapper.toGrpcStringMap(value.template_props),
            attachments:
                value.attachments ?
                    { attachments: value.attachments.map((value) => TypesMapper.toGrpcNotificationAttachment(value)) } :
                    undefined,
            reply_to: value.reply_to ? TypesMapper.toGrpcNotificationEmail(value.reply_to) : undefined,

        }
    }
}