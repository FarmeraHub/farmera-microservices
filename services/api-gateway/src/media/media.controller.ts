import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { MediaService } from './media.service';
import { CreateMediaDto, MediaType } from './dto';
import { User } from '../common/decorators/user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User as UserInterface } from '../common/interfaces/user.interface';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a media file',
    description: 'Upload an image, video, or document to Azure Blob Storage',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'File uploaded successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            src: { type: 'string' },
            groupType: { type: 'string', enum: Object.values(MediaType) },
            uploadedBy: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
              },
            },
            uploadedAt: { type: 'string', format: 'date-time' },
            contentType: { type: 'string' },
            size: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file type not allowed',
  })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @SkipThrottle()
  @ResponseMessage('File uploaded successfully')
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType:
              /^(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm)|application\/pdf)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createMediaDto: CreateMediaDto,
    @User() user: UserInterface,
  ) {
    return await this.mediaService.uploadFile(file, createMediaDto, user);
  }

  @Get('list/:groupType')
  @ApiOperation({
    summary: 'List media files by type',
    description: 'Get a list of media files filtered by group type',
  })
  @ApiParam({
    name: 'groupType',
    enum: MediaType,
    description: 'Type of media to list',
  })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Filter files by name prefix',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media files retrieved successfully',
  })
  @ApiBearerAuth()
  @ResponseMessage('Media files retrieved successfully')
  async listFiles(
    @Param('groupType') groupType: MediaType,
    @Query('prefix') prefix?: string,
  ) {
    return await this.mediaService.listFiles(groupType, prefix);
  }

  @Get('info')
  @ApiOperation({
    summary: 'Get file information',
    description: 'Retrieve detailed information about a specific file',
  })
  @ApiQuery({
    name: 'url',
    description: 'Azure Blob Storage URL of the file',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File information retrieved successfully',
  })
  @ApiBearerAuth()
  @ResponseMessage('File information retrieved successfully')
  async getFileInfo(@Query('url') fileUrl: string) {
    return await this.mediaService.getFileInfo(fileUrl);
  }

  @Delete('delete')
  @ApiOperation({
    summary: 'Delete a media file',
    description: 'Permanently delete a file from Azure Blob Storage',
  })
  @ApiQuery({
    name: 'url',
    description: 'Azure Blob Storage URL of the file to delete',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'File deleted successfully' },
        data: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  @ApiBearerAuth()
  @ResponseMessage('File deleted successfully')
  async deleteFile(@Query('url') fileUrl: string, @User() user: UserInterface) {
    return await this.mediaService.deleteFile(fileUrl, user);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Media service health check',
    description: 'Check if the media service is working properly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Media service is healthy',
  })
  @Public()
  @ResponseMessage('Media service is healthy')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Media Service',
      azure: 'connected',
    };
  }
}
