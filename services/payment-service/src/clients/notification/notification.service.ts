import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationServiceClient } from "@farmera/grpc-proto/dist/notification/notification";
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NotificationMapper } from 'src/mappers/notification/notification.mapper';
import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { UserPreferences } from './entities/user_preferences.entity';
import { SendPushNotificationDto } from './dtos/send-push.dto';
import { SendEmailNotificationDto } from './dtos/send-email.dto';
import { SendNotification } from './dtos/send-notification.dto';

@Injectable()
export class NotificationService implements OnModuleInit {

    private grpcService: NotificationServiceClient;

    constructor(@Inject("NOTIFICATION") private client: ClientGrpc) { }

    onModuleInit() {
        this.grpcService = this.client.getService<NotificationServiceClient>("NotificationService");
    }

    // async createNotification() { }

    // async createTemplateNotification() { }

    async getTemplate(templateId: number): Promise<Template> {
        const result = await firstValueFrom(this.grpcService.getTemplate({ template_id: templateId }));
        return NotificationMapper.fromGrpcGetTemplateResponse(result);
    }

    async createTemplate(newTemplate: CreateTemplateDto): Promise<Template> {
        const result = await firstValueFrom(this.grpcService.createTemplate({
            name: newTemplate.name,
            content: newTemplate.content
        }));
        return NotificationMapper.fromGrpcGetTemplateResponse(result);
    }

    async sendNotification(request: SendNotification) {
        return await firstValueFrom(this.grpcService.sendNotification(
            NotificationMapper.toGrpcSendNotificationRequest(request)
        ));
    }

    async sendPushNotification(request: SendPushNotificationDto) {
        return await firstValueFrom(this.grpcService.sendPushNotification(
            NotificationMapper.toGrpcSendPushNotificationRequest(request)
        ));
    }

    async sendEmailNotification(request: SendEmailNotificationDto) {
        return await firstValueFrom(this.grpcService.sendEmailNotification(
            NotificationMapper.toGrpcSendEmailNotificationRequest(request)
        ));
    }

    // async createUserPreferences() { }

    async getUserPreferences(userId: string): Promise<UserPreferences> {
        const result = await firstValueFrom(this.grpcService.getUserPreferences({ user_id: userId }));
        return NotificationMapper.fromGrpcGetUserPreferencesResponse(result);
    }

    // async updateUserPreferences() { }

    // async createUserDeviceToken() { }

    async getUserDevices(userId: string) {
        return await firstValueFrom(this.grpcService.getUserDevices({ user_id: userId }));
    }

    // async deleteUserDeviceToken() { }
}
