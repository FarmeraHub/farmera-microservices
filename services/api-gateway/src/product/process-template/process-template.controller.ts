import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ProcessTemplateService } from './process-template.service';
import { User } from '../../common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { Request } from 'express';

@Controller('process-template')
export class ProcessTemplateController {
  constructor(
    private readonly processTemplateService: ProcessTemplateService,
  ) {}

  @Post()
  async createProcessTemplate(@Body() createDto: any, @Req() req: Request) {
    return await this.processTemplateService.createProcessTemplate(
      createDto,
      req,
    );
  }

  @Get('farm')
  async getProcessTemplatesByFarm(@Req() req: Request) {
    return await this.processTemplateService.getProcessTemplatesByFarm(req);
  }

  @Get(':id')
  async getProcessTemplateById(
    @Param('id', ParseIntPipe) processId: number,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.getProcessTemplateById(
      processId,
      req,
    );
  }

  @Put(':id')
  async updateProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @Body() updateDto: any,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.updateProcessTemplate(
      processId,
      updateDto,
      req,
    );
  }

  @Delete(':id')
  async deleteProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.deleteProcessTemplate(
      processId,
      req,
    );
  }

  @Get(':id/steps')
  async getProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.getProcessSteps(processId, req);
  }

  @Put(':id/steps/reorder')
  async reorderProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Body() stepOrders: { step_id: number; step_order: number }[],
    @Req() req: Request,
  ) {
    return await this.processTemplateService.reorderProcessSteps(
      processId,
      stepOrders,
      req,
    );
  }

  // Product assignment endpoints
  @Post('product/:productId/assign')
  async assignProductToProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() assignDto: any,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.assignProductToProcess(
      productId,
      assignDto,
      req,
    );
  }

  @Get('product/:productId/assignment')
  async getProductProcessAssignment(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.getProductProcessAssignment(
      productId,
      req,
    );
  }

  @Delete('product/:productId/assignment')
  async unassignProductFromProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req: Request,
  ) {
    return await this.processTemplateService.unassignProductFromProcess(
      productId,
      req,
    );
  }
}
