import { Farm } from './../../farms/entities/farm.entity';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Headers,
} from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { FarmAdminService } from './farm-admin.service';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';

@Controller('admin/farms')
export class FarmAdminController {
  constructor(private readonly farmAdminService: FarmAdminService) {}
  @Get('test')
  getTest() {
    return 'test admin farm';
  }

  // lấy danh sách farm đang chờ duyệt dành cho admin
  // @Get('pending')
  // async getPendingFarms(): Promise<Farm[]> {
  //     return this.farmAdminService.getPendingFarms();
  // }

  // lấy thông tin của farm theo id farm dành cho admin
  @Get(':farmId')
  async getFarmById(@Param('farmId') farmId: string): Promise<Farm> {
    const farm = await this.farmAdminService.getFarmById(farmId);
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }
    return farm;
  }
  // cập nhật trạng thái farm dành cho admin
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFarmStatusDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<Farm> {
    console.log('helloo', dto.reason, dto.status, userId);
    return this.farmAdminService.updateFarmStatus(id, dto, userId);
  }
}
