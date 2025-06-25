import { NotificationServiceClient } from '@farmera/grpc-proto/dist/notification/notification';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateUserNotiPreferenceDto } from './dto/create-preference.dto';
import { UserNotiPreference } from './entities/user-preferences.dto';
import { EnumMapper } from 'src/mappers/common/enum.mapper';
import { TypesMapper } from 'src/mappers/common/types.mapper';
import { UserPreferenceMapper } from 'src/mappers/notification/user_preference.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { firstValueFrom } from 'rxjs';
import { UpdateUserNotiPreferenceDto } from './dto/update-preference.dto';
import { DeviceToken } from './entities/device-token.dto';
import { CreateDeviceTokenDto } from './dto/create-device.dto';

@Injectable()
export class UserPreferencesService {

    private readonly logger = new Logger(UserPreferencesService.name);
    private notificationGrpcService: NotificationServiceClient;

    constructor(
        @Inject("NOTIFICATION_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.notificationGrpcService = this.client.getService<NotificationServiceClient>("NotificationService")
    }

    async createUserPreferences(dto: CreateUserNotiPreferenceDto): Promise<UserNotiPreference> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.createUserPreferences({
                user_id: dto.user_id,
                user_email: dto.user_email,
                transactional_channels: dto.transactional_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                system_alert_channels: dto.system_alert_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                chat_channels: dto.chat_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                do_not_disturb_start: dto.do_not_disturb_start,
                do_not_disturb_end: dto.do_not_disturb_end,
                time_zone: dto.time_zone,
            }));
            return UserPreferenceMapper.fromGrpcUserPreference(result)
        }
        catch (err) {
            this.logger.error(`[createUserPreferences] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getUserPreferences(userId: string): Promise<UserNotiPreference> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.getUserPreferences({
                user_id: userId,
            }));
            return UserPreferenceMapper.fromGrpcUserPreference(result);
        }
        catch (err) {
            this.logger.error(`[getUserPreferences] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async updateUserPreferences(userId: string, dto: UpdateUserNotiPreferenceDto): Promise<UserNotiPreference> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.updateUserPreferences({
                user_id: userId,
                user_email: dto.user_email,
                transactional_channels: dto.transactional_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                system_alert_channels: dto.system_alert_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                chat_channels: dto.chat_channels.map((value) => EnumMapper.toGrpcNotificationChannel(value)),
                do_not_disturb_start: dto.do_not_disturb_start,
                do_not_disturb_end: dto.do_not_disturb_end,
                time_zone: dto.time_zone,
            }));
            return UserPreferenceMapper.fromGrpcUserPreference(result)
        }
        catch (err) {
            this.logger.error(`[createUserPreferences] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async registerDevice(dto: CreateDeviceTokenDto): Promise<DeviceToken> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.createUserDeviceToken({
                user_id: dto.user_id,
                device_token: dto.device_token,
            }));
            return {
                user_id: result.user_id,
                device_token: result.device_token,
            }
        }
        catch (err) {
            this.logger.error(`[registerDevice] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async deleteUserDeviceToken(userId: string, token: string): Promise<boolean> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.deleteUserDeviceToken({
                user_id: userId,
                device_token: token
            }));
            return result.success;
        }
        catch (err) {
            this.logger.error(`[deleteUserDeviceToken] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
