import { Controller, Post, Body, UseInterceptors, UploadedFiles, Param, BadRequestException, Get, Query } from '@nestjs/common';
import { FarmService } from './farm.service';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { Farm } from './entities/farm.entity';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';


@Controller('farm')
export class FarmController {
    constructor(private readonly farmsService: FarmService) { }

    @Post('register')
    async farmRegister(@User() user: UserInterface, @Body() farmRegistration: FarmRegistrationDto): Promise<Farm> {
        return await this.farmsService.farmRegister(farmRegistration, user.id);
    }

    @Post("verify/:farmId")
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cccd', maxCount: 1 },
            { name: 'biometric_video', maxCount: 1 },
        ]),
    )
    async farmVerify(
        @UploadedFiles() file: {
            cccd?: Express.Multer.File[];
            biometric_video?: Express.Multer.File[];
        },
        @Param("farmId") farmId: string,
        @User() user: UserInterface
    ) {
        if (!file || !file.cccd?.[0] || !file.biometric_video?.[0]) {
            throw new BadRequestException("Thiếu ảnh CCCD hoặc video sinh trắc học");
        }

        return await this.farmsService.farmVerify(
            file.cccd?.[0],
            file.biometric_video?.[0],
            farmId,
            user.id
        );
    }

    @Get("my-farm")
    async getMyFarm(@User() user: UserInterface) {
        return await this.farmsService.getFarmByUserId(user.id);
    }

    @Public()
    @Get("owner/:userId")
    async getFarmByUserId(@Param("userId") userId: string) {
        return await this.farmsService.getFarmByUserId(userId);
    }

    @Public()
    @Get(":farmId")
    async getFarm(@Param("farmId") farmId: string) {
        return await this.farmsService.getFarm(farmId);
    }

    // //Update farm của người dùng đã đăng nhập
    // @Patch(':id')
    // async updateFarm(
    //     @Request() req: Request,
    //     @Param('id') id: string,
    //     @Body() updateFarmDto: UpdateFarmDto,
    // ) {
    //     const userId = req.headers['x-user-id'];
    //     return this.farmsService.updateFarm(
    //         id,
    //         updateFarmDto,
    //         userId,
    //     );
    // }
}