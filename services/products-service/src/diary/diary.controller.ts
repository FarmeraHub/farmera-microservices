import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  async create(
    @Body() createDiaryDto: CreateDiaryDto,
    @Headers('x-user-id') userId: string,
  ) {
    return await this.diaryService.create(createDiaryDto, userId);
  }

  @Get('process/:processId')
  async findByProcess(@Param('processId', ParseIntPipe) processId: number) {
    return await this.diaryService.findByProcessId(processId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.diaryService.findOne(id);
  }

  @Patch()
  async update(
    @Body() updateDiaryDto: UpdateDiaryDto,
    @Headers('x-user-id') userId: string,
  ) {
    return await this.diaryService.update(updateDiaryDto, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-id') userId: string,
  ) {
    return await this.diaryService.remove(id, userId);
  }
}
