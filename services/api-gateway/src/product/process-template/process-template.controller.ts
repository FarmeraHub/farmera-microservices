import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProcessTemplateService } from './process-template.service';
import { User } from '../../common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
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
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.createProcessTemplate(
      createDto,
      user,
    );
  }

  @Get('farm')
  async getProcessTemplatesByFarm(@User() user: UserInterface) {
    return await this.processTemplateService.getProcessTemplatesByFarm(user);
  }

  @Get(':id')
  async getProcessTemplateById(
    @Param('id', ParseIntPipe) processId: number,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.getProcessTemplateById(
      processId,
      user,
    );
  }

  @Put(':id')
  async updateProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @Body() updateDto: UpdateProcessTemplateDto,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.updateProcessTemplate(
      processId,
      updateDto,
      user,
    );
  }

  @Delete(':id')
  async deleteProcessTemplate(
    @Param('id', ParseIntPipe) processId: number,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.deleteProcessTemplate(
      processId,
      user,
    );
  }

  @Get(':id/steps')
  async getProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.getProcessSteps(processId, user);
  }

  @Put(':id/steps/reorder')
  async reorderProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Body() stepOrders: { step_id: number; step_order: number }[],
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.reorderProcessSteps(
      processId,
      stepOrders,
      user,
    );
  }

  // Product assignment endpoints
  @Post('product/:productId/assign')
  async assignProductToProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() assignDto: AssignProductToProcessDto,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.assignProductToProcess(
      productId,
      assignDto,
      user,
    );
  }

  @Get('product/:productId/assignment')
  async getProductProcessAssignment(
    @Param('productId', ParseIntPipe) productId: number,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.getProductProcessAssignment(
      productId,
      user,
    );
  }

  @Delete('product/:productId/assignment')
  async unassignProductFromProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @User() user: UserInterface,
  ) {
    return await this.processTemplateService.unassignProductFromProcess(
      productId,
      user,
    );
  }
}
