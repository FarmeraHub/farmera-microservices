import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { AssignProductToProcessDto } from './dto/assign-product-process.dto';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { SimpleCursorPagination } from 'src/pagination/dto/pagination-options.dto';

@Controller('process')
export class ProcessController {
  constructor(
    private readonly processService: ProcessService,
  ) { }

  @Post()
  async createProcess(
    @Body() createDto: CreateProcessDto,
    @User() user: UserInterface,
  ) {
    return await this.processService.createProcess(
      createDto,
      user,
    );
  }

  @Get('farm')
  async getProcessByFarm(@User() user: UserInterface, @Query() pagination: SimpleCursorPagination) {
    return await this.processService.getProcessesByFarm(user, pagination);
  }

  @Get(':id')
  async getProcessById(
    @Param('id', ParseIntPipe) processId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.getProcessById(
      processId,
      user,
    );
  }

  @Patch(':id')
  async updateProcess(
    @Param('id', ParseIntPipe) processId: number,
    @Body() updateDto: UpdateProcessDto,
    @User() user: UserInterface,
  ) {
    return await this.processService.updateProcess(
      processId,
      updateDto,
      user,
    );
  }

  // @Delete(':id')
  // async deleteProcess(
  //   @Param('id', ParseIntPipe) processId: number,
  //   @User() user: UserInterface,
  // ) {
  //   return await this.processService.deleteProcess(
  //     processId,
  //     user,
  //   );
  // }

  @Get(':id/steps')
  async getProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.getProcessSteps(processId, user);
  }

  @Put(':id/steps/reorder')
  async reorderProcessSteps(
    @Param('id', ParseIntPipe) processId: number,
    @Body() stepOrders: { step_id: number; step_order: number }[],
    @User() user: UserInterface,
  ) {
    return await this.processService.reorderProcessSteps(
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
    return await this.processService.assignProductToProcess(
      productId,
      assignDto,
      user,
    );
  }

  @Get('product/:productId/assignment')
  async getProductProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.getProductProcess(
      productId,
      user,
    );
  }

  @Delete('product/:productId/assignment')
  async unassignProductFromProcess(
    @Param('productId', ParseIntPipe) productId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.unassignProductFromProcess(
      productId,
      user,
    );
  }

  // Step Diary endpoints
  @Post('step-diary')
  async createStepDiary(
    @Body() createStepDiaryDto: CreateStepDiaryDto,
    @User() user: UserInterface,
  ) {
    return await this.processService.createStepDiary(
      createStepDiaryDto,
      user,
    );
  }

  @Get('product/:productId/step/:stepId/diaries')
  async getStepDiaries(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.getStepDiaries(
      productId,
      stepId,
      user,
    );
  }

  @Get('product/:productId/diaries')
  async getProductDiaries(
    @Param('productId', ParseIntPipe) productId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.getProductDiaries(productId, user);
  }

  @Patch('step-diary/:diaryId')
  async updateStepDiary(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @Body() updateDto: UpdateStepDiaryDto,
    @User() user: UserInterface,
  ) {
    return await this.processService.updateStepDiary(
      updateDto,
      diaryId,
      user,
    );
  }

  @Delete('step-diary/:diaryId')
  async deleteStepDiary(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @User() user: UserInterface,
  ) {
    return await this.processService.deleteStepDiary(diaryId, user);
  }
}
