import {
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  Headers,
  Body,
  UploadedFiles,
  BadRequestException,
  Res,
  Param,
} from '@nestjs/common';
import { ProcessService } from './process.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateProcessDto } from './dto/create-process.dto';
import { TransformBigIntInterceptor } from 'src/common/interceptors/transform-bigint.interceptor';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  // Create a new process
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'process_images', maxCount: 5 },
      { name: 'process_videos', maxCount: 5 },
    ]),
  )
  async createProcess(
    @Headers('x-user-id') userId: string,
    @Body() createProcessDto: CreateProcessDto,
    @UploadedFiles()
    files: {
      process_images: Express.Multer.File[];
      process_videos?: Express.Multer.File[];
    },
  ) {
    if (!files.process_images || files.process_images.length === 0) {
      throw new BadRequestException('Bắt buộc cần ít nhất 1 ảnh.');
    }

    return this.processService.createProcess(createProcessDto, userId, files);
  }

  // Get all processes
  @Get('product/:id')
  async getProductProcess(@Param('id') productId: string) {
    return this.processService.getProcesses(productId);
  }

  // Get process by id
  @Get(':id')
  async getProcess(@Param('id') processId: number) {
    return this.processService.getProcess(processId);
  }

  @Get('onchain/:id')
  @UseInterceptors(TransformBigIntInterceptor)
  async getOnChainProcess(@Param('id') processId: number) {
    return this.processService.getOnChainProcess(processId);
  }

  @Get('onchain/product/:id')
  @UseInterceptors(TransformBigIntInterceptor)
  async getOnChainProductProcessIds(@Param('id') processId: string) {
    return this.processService.getOnChainProductProcessIds(processId);
  }

  @Get('verified/:id')
  async getVerifiedProcess(@Param('id') processId: number) {
    return this.processService.getVerifiedProcess(processId);
  }

  @Get('verified/product/:id')
  async getVerifiedProcesses(@Param('id') productId: string) {
    return this.processService.getVerifiedProcesses(productId);
  }
}
