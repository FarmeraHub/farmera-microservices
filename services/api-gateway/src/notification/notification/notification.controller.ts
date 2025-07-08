import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SendNotificationDto } from './dto/send.dto';

@Controller('notification')
export class NotificationController {

    constructor(private readonly notificationService: NotificationService) { }

    @Get("template/:template_id")
    async getTemplate(@Param("template_id") templateId: number) {
        return await this.notificationService.getTemplate(templateId);
    }

    @Post("template")
    async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
        return await this.notificationService.createTemplate(createTemplateDto);
    }

    @Post("send")
    async sendNotification(@Body() sendDto: SendNotificationDto) {
        return await this.notificationService.sendNotification(sendDto);
    }
}
