import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Headers,
  Patch,
  Delete,
} from '@nestjs/common';
import { StepDiaryService } from './step-diary.service';
import { CreateStepDiaryDto } from './dto/create-step-diary.dto';
import { UpdateStepDiaryDto } from './dto/update-step-diary.dto';

@Controller('diary')
export class StepDiaryController {
  constructor(private readonly stepDiaryService: StepDiaryService) {}

  @Post('step')
  async createStepDiary(
    @Body() createDto: CreateStepDiaryDto,
    @Headers('user-id') userId: string,
  ) {
    return await this.stepDiaryService.createStepDiary(createDto, userId);
  }

  @Patch('step')
  async updateStepDiary(
    @Body() updateDto: UpdateStepDiaryDto,
    @Headers('user-id') userId: string,
  ) {
    return await this.stepDiaryService.updateStepDiary(updateDto, userId);
  }

  @Delete('step/:diaryId')
  async deleteStepDiary(
    @Param('diaryId', ParseIntPipe) diaryId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.stepDiaryService.deleteStepDiary(diaryId, userId);
  }

  @Get('product/:productId/step/:stepId')
  async getStepDiaries(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.stepDiaryService.getStepDiaries(
      productId,
      stepId,
      userId,
    );
  }

  @Get('product/:productId')
  async getProductDiaries(
    @Param('productId', ParseIntPipe) productId: number,
    @Headers('user-id') userId: string,
  ) {
    return await this.stepDiaryService.getProductDiaries(productId, userId);
  }
}
