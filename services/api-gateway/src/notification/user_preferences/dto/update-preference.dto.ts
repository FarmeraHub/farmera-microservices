import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from 'src/common/enums/notification/notification-channel.enum';

export class UpdateUserNotiPreferenceDto {
    @IsEmail()
    user_email: string;

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    transactional_channels: NotificationChannel[];

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    system_alert_channels: NotificationChannel[];

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    chat_channels: NotificationChannel[];

    @IsOptional()
    @IsString()
    do_not_disturb_start?: string;

    @IsOptional()
    @IsString()
    do_not_disturb_end?: string;

    @IsString()
    @IsNotEmpty()
    time_zone: string;
}
