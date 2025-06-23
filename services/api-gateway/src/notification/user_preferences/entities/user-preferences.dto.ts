import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from 'src/common/enums/notification/notification-channel.enum';

export class UserNotiPreference {
    user_id: string;
    user_email: string;
    transactional_channels: NotificationChannel[];
    system_alert_channels: NotificationChannel[];
    chat_channels: NotificationChannel[];
    do_not_disturb_start?: string;
    do_not_disturb_end?: string;
    time_zone: string;
}
