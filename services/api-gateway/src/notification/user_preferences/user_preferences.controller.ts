import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserNotiPreferenceDto } from './dto/create-preference.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateDeviceTokenDto } from './dto/create-device.dto';
import { UserPreferencesService } from './user_preferences.service';
import { UpdateUserNotiPreferenceDto } from './dto/update-preference.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { SystemAuth } from 'src/common/decorators/system-auth.decorator';


@Controller('user-notification-preferences')
export class UserPreferencesController {

    constructor(private readonly userPreferenceService: UserPreferencesService) { }

    @Post()
    async createUserPreferences(@User() user: UserInterface, @Body() createPreferenceDto: CreateUserNotiPreferenceDto) {
        return await this.userPreferenceService.createUserPreferences(user.id, user.email, createPreferenceDto);
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
    async registerDeviceToken(@User() user: UserInterface, @Body() createDeviceDto: CreateDeviceTokenDto) {
        return await this.userPreferenceService.registerDevice(user.id, createDeviceDto);
    }

    @Delete("device/:token")
    async deleteDeviceToken(@User() user: UserInterface, @Param("token") token: string) {
        return await this.userPreferenceService.deleteUserDeviceToken(user.id, token);
    }
}
