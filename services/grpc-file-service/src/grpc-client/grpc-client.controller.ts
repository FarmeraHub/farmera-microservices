import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { GrpcClientService } from './grpc-client.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('grpc-client')
export class GrpcClientController {

    constructor(private readonly service: GrpcClientService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
        return await this.service.upload(file);
    }
}
