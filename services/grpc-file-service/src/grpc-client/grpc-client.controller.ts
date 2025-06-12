import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { GrpcClientService } from './grpc-client.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('grpc-client')
export class GrpcClientController {

    constructor(private readonly service: GrpcClientService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
        return await this.service.upload(file);
    }

    @Post("multi-files")
    @UseInterceptors(FilesInterceptor('files'))
    async multipleUpload(@UploadedFiles() files: Express.Multer.File[]) {
        return await this.service.multipleUpload(files);
    }
}
