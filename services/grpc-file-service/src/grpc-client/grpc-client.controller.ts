import { Body, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { GrpcClientService } from './grpc-client.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('grpc-client')
export class GrpcClientController {

    constructor(private readonly service: GrpcClientService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    upload(@UploadedFile() file: Express.Multer.File) {
        return this.service.upload(file);
    }

    @Post("multi-files")
    @UseInterceptors(FilesInterceptor('files'))
    multipleUpload(@UploadedFiles() files: Express.Multer.File[]) {
        return this.service.multipleUpload(files);
    }

    @Post("one-stream-multi-files")
    @UseInterceptors(FilesInterceptor('files'))
    oneStreamMultipleUpload(@UploadedFiles() files: Express.Multer.File[]) {
        return this.service.oneStreamUpload(files);
    }
}
