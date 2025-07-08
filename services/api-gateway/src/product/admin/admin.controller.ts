import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/interfaces/user.interface';
import { AdminService } from './admin.service';
import { UpdateProductStatusForAdminDto } from './dto/update-product-status.dto';
import { UpdateFarmStatusDto } from './dto/update-farm-status.dto';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { User } from 'src/common/decorators/user.decorator';
import { AdminSearchFarmDto } from './dto/search-farm-admin.dto';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {

    constructor(private readonly adminService: AdminService) { }

    @Patch("farm/status/:farm_id")
    async updateFarmStatus(
        @Param("farm_id") farmId: string, @User() user: UserInterface, @Body() updateStatusDto: UpdateFarmStatusDto
    ) {
        return await this.adminService.updateFarmStatus(farmId, user.id, updateStatusDto);
    }

    @Patch("product/status/:product_id")
    async updateProductStatus(@Param("product_id") productId: number, @Body() updateStatusDto: UpdateProductStatusForAdminDto) {
        return await this.adminService.updateProductStatus(productId, updateStatusDto.status);
    }

    @Get('farm/search')
    async searchProducts(@Query() searchProductsDTo: AdminSearchFarmDto) {
        return await this.adminService.searchFarm(searchProductsDTo);
    }
}
