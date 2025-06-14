import { BadRequestException, Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Post } from "@nestjs/common";
import { GhnService } from "./ghn.service";
import { IsNotEmpty, IsString } from "class-validator";


class RequestDistrictId {
    @IsString()
    @IsNotEmpty()
    district_name: string;

    @IsString()
    @IsNotEmpty()
    province_name: string;
}

@Controller('ghn')
export class GhnController {
    constructor(
        private readonly ghnService: GhnService, // Assuming GhnService is imported and available
    ) { }
    @Get('province-id/:name')
    async getProvinceId(@Param('name') provinceName: string) {
        try {
            const provinceId = await this.ghnService.getIdProvince(provinceName);
            if (provinceId === null) {
                throw new NotFoundException(`Province ID not found for '${provinceName}'`);
            }
            return { provinceName, provinceId };
        } catch (error) {
            // Log the error server-side if not already logged sufficiently in the service
            console.error(`Error in getProvinceId controller: ${error.message}`);
            if (error instanceof NotFoundException) {
                throw error; // Re-throw NotFoundException as is
            }
            // For other errors, return a generic server error
            throw new InternalServerErrorException('Failed to retrieve province ID from GHN service.');
        }
    }

    @Post('district-id/')
    async getDistrictId(
        @Body() districtNameBody: RequestDistrictId, // Assuming districtName is passed in the body
    ) {
        try {
            if (!districtNameBody.district_name || !districtNameBody.province_name) { // Corrected
                throw new BadRequestException('District name and province name are required'); // Use BadRequestException
            }
            const provinceId = await this.ghnService.getIdProvince(districtNameBody.province_name);
            if (provinceId === null) {
                throw new NotFoundException(`Province ID not found for '${districtNameBody.province_name}'`);
            }
            const districtId = await this.ghnService.getIdDistrict(districtNameBody.district_name, provinceId);
            if (districtId === null) {
                throw new NotFoundException(`District ID not found for '${districtNameBody.district_name}' in province '${districtNameBody.province_name}'`);
            }
            return { districtName: districtNameBody.district_name, districtId, provinceId };
        } catch (error) {
            console.error(`Error in getDistrictId controller: ${error.message}`);
            if (error instanceof NotFoundException) {
                throw error; // Re-throw NotFoundException as is
            }
            // For other errors, return a generic server error
            throw new InternalServerErrorException('Failed to retrieve district ID from GHN service.');
        }

    }
}