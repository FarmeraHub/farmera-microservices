import { NotificationChannel } from "../enums/channel";

export class UserPreferences {
    user_id: string;
    user_email: string;
    transaction_channels: NotificationChannel[];
    system_alert_channels: NotificationChannel[];
    chat_channels: NotificationChannel[];
    do_not_disturb_start: string | undefined;
    do_not_disturb_end: string | undefined;
    time_zone: string;
}