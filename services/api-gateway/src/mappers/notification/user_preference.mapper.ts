import { CreateUserPreferencesResponse } from "@farmera/grpc-proto/dist/notification/notification";
import { UserNotiPreference } from "src/notification/user_preferences/entities/user-preferences.dto";
import { EnumMapper } from "../common/enum.mapper";

export class UserPreferenceMapper {
    static fromGrpcUserPreference(value: CreateUserPreferencesResponse): UserNotiPreference {
        return {
            user_id: value.user_id,
            user_email: value.user_email,
            transactional_channels: value.transactional_channels.map((value) => EnumMapper.fromGrpcNotificationChannel(value)),
            system_alert_channels: value.system_alert_channels.map((value) => EnumMapper.fromGrpcNotificationChannel(value)),
            chat_channels: value.chat_channels.map((value) => EnumMapper.fromGrpcNotificationChannel(value)),
            do_not_disturb_start: value.do_not_disturb_start,
            do_not_disturb_end: value.do_not_disturb_end,
            time_zone: value.time_zone,
        }
    }
}