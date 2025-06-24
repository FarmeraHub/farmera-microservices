import { NotificationServiceClient } from '@farmera/grpc-proto/dist/notification/notification';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateTemplateDto } from './dto/create-template.dto';
import { firstValueFrom } from 'rxjs';
import { NotificationMapper } from 'src/mappers/notification/notification.mapper';
import { ErrorMapper } from 'src/mappers/common/error.mapper';
import { Template } from './entities/template.entity';
import { SendNotificationDto } from './entities/send.entity';

@Injectable()
export class NotificationService {

    private readonly logger = new Logger(NotificationService.name);
    private notificationGrpcService: NotificationServiceClient;

    constructor(
        @Inject("NOTIFICATION_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.notificationGrpcService = this.client.getService<NotificationServiceClient>("NotificationService")
    }

    async createTemplate(createTemplateDto: CreateTemplateDto): Promise<Template> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.createTemplate({
                name: createTemplateDto.name,
                content: createTemplateDto.content,
            }));
            return NotificationMapper.fromGrpcTemplate(result);
        }
        catch (err) {
            this.logger.error(`[createUserPreferences] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async getTemplate(templateId: number): Promise<Template> {
        try {
            const result = await firstValueFrom(this.notificationGrpcService.getTemplate({
                template_id: templateId,
            }));
            return NotificationMapper.fromGrpcTemplate(result);
        }
        catch (err) {
            this.logger.debug(`[createUserPreferences] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }

    async sendNotification(request: SendNotificationDto) {
        try {
            return await firstValueFrom(this.notificationGrpcService.sendNotification(
                NotificationMapper.toGrpcSendNotificationRequest(request)
            ));
        }
        catch (err) {
            this.logger.error(`[sendNotification] ${err.message}`);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}
