import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get overall system health' })
  @ApiResponse({ status: 200, description: 'Returns health status of all services' })
  async getSystemHealth() {
    return await this.healthService.getSystemHealth();
  }

  @Public()
  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health information' })
  @ApiResponse({ status: 200, description: 'Returns detailed health status with metrics' })
  async getDetailedHealth() {
    return await this.healthService.getDetailedHealth();
  }
} 