import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserInterface } from '../../common/interfaces/user.interface';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { Public } from 'src/common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Diary } from './entities/diary.entity';

@ApiTags('Diary')
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a diary entry',
    description: 'Creates a new diary entry for a process step.',
  })
  @ApiBody({ type: CreateDiaryDto })
  @ApiResponse({
    status: 201,
    description: 'Diary entry created successfully',
    type: Diary,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or creation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async createDiary(
    @User() user: UserInterface,
    @Body() createDiaryDto: CreateDiaryDto,
  ) {
    return await this.diaryService.createDiary(user.id, createDiaryDto);
  }

  @Public()
  @Get('process/:process_id')
  @ApiOperation({
    summary: 'Get diary entries for a process',
    description: 'Retrieves all diary entries for a specific process.',
  })
  @ApiParam({ name: 'process_id', description: 'ID of the process' })
  @ApiResponse({
    status: 200,
    description: 'List of diary entries',
    type: [Diary],
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getDiariesByProcess(
    @Param('process_id', ParseIntPipe) processId: number,
  ) {
    return await this.diaryService.getDiariesByProcess(processId);
  }

  @Public()
  @Get(':diary_id')
  @ApiOperation({
    summary: 'Get diary entry by ID',
    description: 'Retrieves a diary entry by its ID.',
  })
  @ApiParam({ name: 'diary_id', description: 'ID of the diary entry' })
  @ApiResponse({
    status: 200,
    description: 'Diary entry retrieved successfully',
    type: Diary,
  })
  @ApiNotFoundResponse({ description: 'Diary entry not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getDiary(@Param('diary_id', ParseIntPipe) diaryId: number) {
    return await this.diaryService.getDiary(diaryId);
  }

  @Put()
  @ApiOperation({
    summary: 'Update a diary entry',
    description: 'Updates an existing diary entry.',
  })
  @ApiBody({ type: UpdateDiaryDto })
  @ApiResponse({
    status: 200,
    description: 'Diary entry updated successfully',
    type: Diary,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or update failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Diary entry not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async updateDiary(
    @User() user: UserInterface,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    return await this.diaryService.updateDiary(user.id, updateDiaryDto);
  }

  @Delete(':diary_id')
  @ApiOperation({
    summary: 'Delete a diary entry',
    description: 'Deletes a diary entry by its ID.',
  })
  @ApiParam({ name: 'diary_id', description: 'ID of the diary entry' })
  @ApiResponse({ status: 200, description: 'Diary entry deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Diary entry not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async deleteDiary(
    @User() user: UserInterface,
    @Param('diary_id', ParseIntPipe) diaryId: number,
  ) {
    return await this.diaryService.deleteDiary(user.id, diaryId);
  }
}
