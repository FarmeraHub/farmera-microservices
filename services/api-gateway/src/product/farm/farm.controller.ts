import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Param,
  BadRequestException,
  Get,
  Query,
  Put,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { FarmService } from './farm.service';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { Farm } from './entities/farm.entity';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { SearchFarmDto } from './dto/search-farm.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('Farm')
@Controller('farm')
export class FarmController {
  constructor(private readonly farmsService: FarmService) { }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new farm',
    description: 'Registers a new farm for the authenticated user.',
  })
  @ApiBody({ type: FarmRegistrationDto })
  @ApiResponse({
    status: 201,
    description: 'Farm registered successfully',
    type: Farm,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or registration failed',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async farmRegister(
    @User() user: UserInterface,
    @Body() farmRegistration: FarmRegistrationDto,
  ): Promise<Farm> {
    return await this.farmsService.farmRegister(farmRegistration, user.id);
  }

  @Post('verify/:farmId')
  @ApiOperation({
    summary: 'Verify a farm',
    description:
      'Uploads verification files (CCCD and biometric video) for a farm.',
  })
  @ApiParam({ name: 'farmId', description: 'ID of the farm to verify' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cccd: { type: 'string', format: 'binary' },
        biometric_video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Farm verified successfully',
    type: Farm,
  })
  @ApiBadRequestResponse({
    description: 'Missing CCCD or biometric video, or verification failed',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd', maxCount: 1 },
      { name: 'biometric_video', maxCount: 1 },
    ]),
  )
  async farmVerify(
    @UploadedFiles()
    file: {
      cccd?: Express.Multer.File[];
      biometric_video?: Express.Multer.File[];
    },
    @Param('farmId') farmId: string,
    @User() user: UserInterface,
  ) {
    if (!file || !file.cccd?.[0] || !file.biometric_video?.[0]) {
      throw new BadRequestException('Thiếu ảnh CCCD hoặc video sinh trắc học');
    }

    return await this.farmsService.farmVerify(
      file.cccd?.[0],
      file.biometric_video?.[0],
      farmId,
      user.id,
    );
  }

  @Get('my/farm')
  @ApiOperation({
    summary: 'Get my farm',
    description: 'Retrieves the farm associated with the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Farm retrieved successfully',
    type: Farm,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Farm not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getMyFarm(@User() user: UserInterface) {
    return await this.farmsService.getFarmByUserId(user.id);
  }

  @Public()
  @Get('owner/:userId')
  @ApiOperation({
    summary: 'Get farm by user ID',
    description: 'Retrieves the farm for a specific user.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Farm retrieved successfully',
    type: Farm,
  })
  @ApiNotFoundResponse({ description: 'Farm not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getFarmByUserId(@Param('userId') userId: string) {
    return await this.farmsService.getFarmByUserId(userId);
  }

  @Public()
  @Get("stats/:farmId")
  async getFarmStats(@Param("farmId") farmId: string) {
    return await this.farmsService.getFarmStats(farmId);
  }

  @Public()
  @Get('all')
  @ApiOperation({
    summary: 'List all farms',
    description: 'Retrieves a paginated list of all farms.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of farms', type: [Farm] })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async listFarms(@Query() paginationOptions: PaginationOptions) {
    return await this.farmsService.listFarms(paginationOptions);
  }

  @Public()
  @Get('search')
  @ApiOperation({
    summary: 'Search farms',
    description: 'Searches for farms with filters and pagination.',
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'approve_only', required: false, type: Boolean })
  @ApiQuery({ name: 'latitude', required: false, type: Number })
  @ApiQuery({ name: 'longitude', required: false, type: Number })
  @ApiQuery({ name: 'radius_km', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Paginated search result',
    type: [Farm],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async searchFarms(@Query() searchDto: SearchFarmDto) {
    return await this.farmsService.searchFarms(searchDto);
  }

  @Public()
  @Get(':farmId')
  @ApiOperation({
    summary: 'Get farm by ID',
    description: 'Retrieves a farm by its ID.',
  })
  @ApiParam({ name: 'farmId', description: 'Farm ID' })
  @ApiResponse({
    status: 200,
    description: 'Farm retrieved successfully',
    type: Farm,
  })
  @ApiNotFoundResponse({ description: 'Farm not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getFarm(@Param('farmId') farmId: string) {
    return await this.farmsService.getFarm(farmId);
  }

  @Patch(':farmId')
  @ApiOperation({
    summary: 'Update farm information',
    description: 'Updates the farm information for the authenticated user.',
  })
  @ApiParam({ name: 'farmId', description: 'Farm ID' })
  @ApiBody({ type: UpdateFarmDto })
  @ApiResponse({
    status: 200,
    description: 'Farm updated successfully',
    type: Farm,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Farm not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateFarm(
    @Param('farmId') farmId: string,
    @Body() updateFarmDto: UpdateFarmDto,
    @User() user: UserInterface,
  ) {
    return await this.farmsService.updateFarm(farmId, updateFarmDto, user.id);
  }
}
