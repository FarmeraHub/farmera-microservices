import { Body, Controller, Post } from "@nestjs/common";
import { UserGrpcClientService } from "./user.service";

@Controller('test')
export class TestController {
    constructor(
        private readonly userService: UserGrpcClientService,
    ) {
    }

    @Post('get-location')
    async getLocationById(
        @Body() body: any
    ) {
        try {
            const locationId = body.locationId;
            if (!locationId) {
                throw new Error('Location ID is required');
            }
            return await this.userService.getLocationById(locationId);
        } catch (error) {
            throw new Error(`Error fetching location: ${error.message}`);
        }

    }
}