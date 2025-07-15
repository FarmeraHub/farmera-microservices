import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ProcessTemplateService } from './process-template.service';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { UpdateProcessTemplateDto } from './dto/update-process-template.dto';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';

@Controller('process-template')
export class ProcessTemplateController {
  constructor(
    private readonly processTemplateService: ProcessTemplateService,
  ) {}

  @Post()
  async createProcessTemplate(
    @Body() createDto: CreateProcessTemplateDto,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.createProcessTemplate(
      createDto,
      userId,
    );
  }

  @Get('farm')
  async getProcessTemplatesByFarm(@Headers('user-id') userId: string) {
    return await this.processTemplateService.getProcessTemplatesByFarm(userId);
  }

  @Get(':id')
  async getProcessTemplateById(
    @Param('id', ParseIntPipe) processId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.getProcessTemplateById(
      processId,
      userId,
    );
  }

  @Put(':id')
  async updateProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @Body() updateDto: UpdateProcessTemplateDto,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.updateProcessTemplate(
      processId,
      updateDto,
      userId,
    );
  }

  @Delete(':id')
  async deleteProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @Headers('user-id') userId: string,
  ) {
    await this.processTemplateService.deleteProcessTemplate(processId, userId);
    return { message: 'Process template deleted successfully' };
  }

  @Get(':id/steps')
  async getProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.getProcessSteps(processId, userId);
  }

  @Put(':id/steps/reorder')
  async reorderProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Body() stepOrders: { step_id: number; step_order: number }[],
    @Headers('user-id') userId: string,
  ) {
    await this.processTemplateService.reorderProcessSteps(
      processId,
      stepOrders,
      userId,
    );
    return { message: 'Process steps reordered successfully' };
  }

  // Product assignment endpoints
  @Post('/product/:productId/assign')
  async assignProductToProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() assignDto: AssignProductToProcessDto,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.assignProductToProcess(
      productId,
      assignDto,
      userId,
    );
  }

  @Get('/product/:productId/assignment')
  async getProductProcessAssignment(
    @Param('productId', ParseIntPipe) productId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.processTemplateService.getProductProcessAssignment(
      productId,
      userId,
    );
  }

  @Delete('/product/:productId/assignment')
  async unassignProductFromProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @Headers('user-id') userId: string,
  ) {
    await this.processTemplateService.unassignProductFromProcess(
      productId,
      userId,
    );
    return { message: 'Product unassigned from process successfully' };
  }
}
