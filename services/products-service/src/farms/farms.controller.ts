import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FarmsService } from './farms.service';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { Farm } from './entities/farm.entity';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';

@Controller('farm')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) { }

  @Post('register')
  async farmRegister(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Body() farmRegistration: FarmRegistrationDto,
  ): Promise<Farm> {
    return this.farmsService.farmRegister(farmRegistration, userId);
  }

  @Post("verify/:farmId")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd', maxCount: 1 },
      { name: 'biometric_video', maxCount: 1 },
    ]),
  )
  async farmVerify(
    @Headers('x-user-id') userId: string,
    @UploadedFiles() file: {
      cccd?: Express.Multer.File[];
      biometric_video?: Express.Multer.File[];
    },
    @Param("farmId") farmId: string,
  ) {
    if (!file.cccd?.[0] || !file.biometric_video?.[0]) {
      throw new BadRequestException("Thiếu ảnh CCCD hoặc video sinh trắc học");
    }

    return this.farmsService.verifyBiometric(
      file.cccd?.[0],
      file.biometric_video?.[0],
      farmId,
      userId
    );
  }


  //Lấy danh sách farm của người dùng đã đăng nhập
  @Get('my-farm')
  async getMyFarm(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<any> {

    return this.farmsService.findByUserID(userId);
  }

  //Update farm của người dùng đã đăng nhập
  @Patch(':id')
  async updateFarm(
    @Request() req: Request,
    @Param('id') id: string,
    @Body() updateFarmDto: UpdateFarmDto,
  ) {
    const userId = req.headers['x-user-id'];
    return this.farmsService.updateFarm(
      id,
      updateFarmDto,
      userId,
    );
  }
}
