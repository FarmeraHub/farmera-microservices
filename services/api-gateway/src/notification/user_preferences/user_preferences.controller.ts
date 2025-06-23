import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserNotiPreferenceDto } from './dto/create-preference.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateDeviceTokenDto } from './dto/create-device.dto';
import { UserPreferencesService } from './user_preferences.service';
import { UpdateUserNotiPreferenceDto } from './dto/update-preference.dto';


@Controller('user-preferences')
export class UserPreferencesController {

    constructor(private readonly userPreferenceService: UserPreferencesService) { }

    @Post()
    async createUserPreferences(@Body() createPreferenceDto: CreateUserNotiPreferenceDto) {
        return await this.userPreferenceService.createUserPreferences(createPreferenceDto);
    }

    @Get()
    async getUserPreferences(@User() user: UserInterface) {
        return await this.userPreferenceService.getUserPreferences(user.id);
    }

    @Put()
    async updateUserPreferences(@User() user: UserInterface, @Body() updateDto: UpdateUserNotiPreferenceDto) {
        return await this.userPreferenceService.updateUserPreferences(user.id, updateDto);
    }

    @Post("device")
    async registerDeviceToken(@Body() createDeviceDto: CreateDeviceTokenDto) {
        return await this.userPreferenceService.registerDevice(createDeviceDto);
    }

    @Delete("device/:user_id/:token")
    async deleteDeviceToken(@Param("user_id") userId: string, @Param("token") token: string) {
        return await this.userPreferenceService.deleteUserDeviceToken(userId, token);
    }
}
