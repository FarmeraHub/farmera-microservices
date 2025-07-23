import { Controller, Get, Param, Query } from '@nestjs/common';
import { SubOrderService } from './sub_order.service';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from 'src/common/interfaces/user.interface';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SubOrderStatus } from 'src/common/enums/payment/sub-order-status.enum';
import { FarmService } from 'src/product/farm/farm.service';
@Controller('sub-orders')
export class SubOrderController {
  constructor(
    private readonly subOrderService: SubOrderService,
    private readonly farmsService: FarmService,
  ) {}

  @Get('suborders-by-user')
  @ApiOperation({ summary: 'Get sub-orders by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Sub-orders retrieved successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  @ApiQuery({
    name: 'status',
    enum: SubOrderStatus,
    required: false,
    description: 'Filter sub-orders by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  async getSubOrdersByUser(
    @User() user: UserInterface,
    @Query('status') status?: SubOrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.subOrderService.getSubOrdersByUser(
      user.id,
      status?.toString(),
      page,
      limit,
    );
    return result;
  }

  @Get('suborders-by-farm')
  @ApiOperation({ summary: "Get sub-orders by farm ID or current user's farm" })
  @ApiResponse({
    status: 200,
    description: 'Sub-orders retrieved successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description:
      'Optional farm ID. If not provided, the farm associated with the current user will be used.',
    type: String,
  })
  @ApiQuery({
    name: 'status',
    enum: SubOrderStatus,
    required: false,
    description: 'Filter sub-orders by status (e.g., PENDING, COMPLETED)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  async getSubOrdersByFarm(
    @User() user: UserInterface,
    @Query('farmId') farmId?: string,
    @Query('status') status?: SubOrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!farmId) {
      const farm = await this.farmsService.getFarmByUserId(user.id);
      if (!farm) {
        throw new Error('Farm not found for the current user.');
      }
      farmId = farm.farm_id;
    }

    return this.subOrderService.getSubOrdersByFarm(
      farmId,
      status?.toString(),
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sub-order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sub-order retrieved successfully.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized access.' })
  async getSubOrderById(
    @User() user: UserInterface,
    @Param('id') subOrderId: number,
    @Query('status') status?: SubOrderStatus,
  ) {
    const result = await this.subOrderService.getSubOrderById(subOrderId);
    return result;
  }
}
