import {
  Controller, Post, Body, UploadedFiles, UseInterceptors, UseGuards, Request,
  Get, Param,
  Patch,
  Headers,
  BadRequestException
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FarmsService } from './farms.service';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { Farm } from './entities/farm.entity';


@Controller('farm')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) { }

  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd', maxCount: 1 },
      { name: 'biometric_video', maxCount: 1 }
    ]),

  )
  async farmRegister(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Body() farmRegistration: FarmRegistrationDto,
    @UploadedFiles() files: {
      cccd?: Express.Multer.File[],
      biometric_video?: Express.Multer.File[],
    },
  ): Promise<Farm> {

    return this.farmsService.farmRegister(farmRegistration, userId, files);

  }
  //Lấy danh sách farm của người dùng đã đăng nhập
  @Get('my-farm')
  async getMyFarm(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<any> {

    return this.farmsService.findByUserID(userId);
  }




  //Lấy danh sách farm của người dùng đã đăng nhập
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  //Update farm của người dùng đã đăng nhập
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'profile_images', maxCount: 5 },
      { name: 'certificate_images', maxCount: 5 },
    ]),
  )
  async updateFarm(
    @Request() req: Request,
    @Param('id') id: string,
    @Body() updateFarmDto: UpdateFarmDto,
    @UploadedFiles() files?: {
      avatar?: Express.Multer.File[],
      profile_images?: Express.Multer.File[],
      certificate_images?: Express.Multer.File[]
    },
  ) {
    const userId = req.headers['x-user-id'];
     const filesData = files || {};
    return this.farmsService.updateFarm(
      id,
      updateFarmDto,
      userId,
      {
        avatarFile: filesData.avatar ? filesData.avatar[0] : undefined,
        profileFiles: filesData.profile_images || [],
        certificateFiles: filesData.certificate_images || [],
      },
    );
  }


}