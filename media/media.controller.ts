import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtDecoded } from 'src/auth/jwt.strategy';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { User } from 'src/decorators/user.decorator';
import { MediaType } from 'src/enums/media-type.enum';
import { S3Service } from 'src/services/s3.service';
import { MediaDocument } from './media.schema';
import { MediaService } from './media.service';
import { Public } from 'src/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('media')
export class MediaController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly mediaService: MediaService,
  ) {}

  // @ResponseMessage('Get media successfully')
  // @Get()
  // async findByFolder(
  //   @Query('limit') pageSize = 20,
  //   @Query('page') pageIndex = 0,
  //   @Query('groupType', new DefaultValuePipe(MediaType.PRODUCT))
  //   groupType: MediaType,
  // ) {
  //   return await this.mediaService.getAllImage(
  //     +pageIndex,
  //     +pageSize,
  //     groupType,
  //   );
  // }

  @SkipThrottle()
  @ResponseMessage('Create media successfully')
  @Post()
  @UseInterceptors(FileInterceptor('files'))
  async upload(
    @User() user: JwtDecoded,
    @UploadedFile() files: Express.Multer.File,
    @Body() body: { groupType: MediaType },
  ) {
    const groupType = body.groupType;
    const url = await this.s3Service.uploadFile(files, groupType);
    return await this.mediaService.create(url, groupType, user);
  }

  @SkipThrottle()
  @ResponseMessage('Delete media successfully')
  @Delete('remove/:id')
  async removeImage(
    @User() user: JwtDecoded,
    @Param('id') id: string,
    @Body() body: { isPermanent: boolean; image: MediaDocument },
  ) {
    if (body.isPermanent) {
      return await this.s3Service.deleteImage(body.image.src);
    }
    return await this.mediaService.delete(id, user);
  }
}
