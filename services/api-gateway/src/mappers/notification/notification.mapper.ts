import { CreateTemplateResponse, SendNotificationRequest } from "@farmera/grpc-proto/dist/notification/notification";
import { Template } from "src/notification/notification/entities/template.entity";
import { TypesMapper } from "../common/types.mapper";
import { SendNotificationDto } from "src/notification/notification/dto/send.dto";
import { EnumMapper } from "../common/enum.mapper";

export class NotificationMapper {
    static fromGrpcTemplate(value: CreateTemplateResponse): Template {
        return {
            template_id: value.template_id,
            name: value.name,
            content: value.content,
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
        }
    }

    static toGrpcSendNotificationRequest(value: SendNotificationDto): SendNotificationRequest {
        return {
            recipent: value.recipient,
            notification_type: EnumMapper.toGrpcNotificationType(value.notification_type),
            channels: value.channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
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