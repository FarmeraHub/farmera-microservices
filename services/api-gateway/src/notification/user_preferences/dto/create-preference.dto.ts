import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from 'src/common/enums/notification/notification-channel.enum';

export class CreateUserNotiPreferenceDto {
    @IsString()
    user_id: string;

    @IsEmail()
    user_email: string;

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    transactional_channels: NotificationChannel[] = [NotificationChannel.EMAIL, NotificationChannel.PUSH];

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    system_alert_channels: NotificationChannel[] = [NotificationChannel.EMAIL, NotificationChannel.PUSH];

    @IsArray()
    @IsEnum(NotificationChannel, { each: true })
    chat_channels: NotificationChannel[] = [NotificationChannel.PUSH];

    @IsOptional()
    @IsString()
    do_not_disturb_start?: string;

    @IsOptional()
    @IsString()
    do_not_disturb_end?: string;

    @IsString()
    @IsNotEmpty()
    time_zone?: string = "Asia/Ho_Chi_Minh";
}
