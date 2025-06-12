import { FileServiceClient, OneStreamUploadImageRequest, OneStreamUploadImageResponse, UploadImageRequest, UploadImageResponse } from '@farmera/grpc-proto/dist/files/files';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { firstValueFrom, Observable, Subject } from 'rxjs';

@Injectable()
export class GrpcClientService implements OnModuleInit {

    private grpcFileService: FileServiceClient;

    constructor(@Inject("FILES_PACKAGE") private client: ClientGrpc) { }

    onModuleInit() {
        this.grpcFileService = this.client.getService<FileServiceClient>('FileService');
    }

    async upload(file: Express.Multer.File): Promise<UploadImageResponse> {
        // send file content (chunk)
        const CHUNK_SIZE = 64 * 1024; // 64 KB
        console.log("buffer total size: ", file.buffer.length);

        const request$ = new Observable<UploadImageRequest>(subscriber => {
            // send metadata
            subscriber.next({
                meta: {
                    file_name: file.originalname,
                    file_type: file.mimetype,
                    total_size: file.buffer.length,
                    file_id: randomUUID(),
                },
            });

            // send chunks
            let offset = 0;
            while (offset < file.buffer.length) {
                const end = Math.min(offset + CHUNK_SIZE, file.buffer.length);
                const chunk = file.buffer.subarray(offset, end);

                subscriber.next({ image: chunk });

                offset = end;

                console.log("sent: ", offset);
            }

            // close stream
            subscriber.complete();
            console.log("complete");
        });

        return firstValueFrom(this.grpcFileService.uploadImage(request$));
    }

    async multipleUpload(files: Express.Multer.File[]): Promise<UploadImageResponse[]> {
        const CHUNK_SIZE = 64 * 1024; // 64 KB

        const uploadPromises = files.map(file => {
            const request$ = new Observable<UploadImageRequest>(subscriber => {
                // send metadata
                subscriber.next({
                    meta: {
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        total_size: file.buffer.length,
                        file_id: randomUUID(),
                    },
                });

                console.log("buffer total size: ", file.buffer.length);

                // send chunks
                let offset = 0;
                while (offset < file.buffer.length) {
                    const end = Math.min(offset + CHUNK_SIZE, file.buffer.length);
                    const chunk = file.buffer.subarray(offset, end);

                    subscriber.next({ image: chunk });

                    offset = end;

                    console.log("sent: ", offset);
                }

                // close stream
                subscriber.complete();
            });

            return firstValueFrom(this.grpcFileService.uploadImage(request$));
        });

        // Đợi tất cả upload hoàn thành
        return Promise.all(uploadPromises);
    }

    async oneStreamUpload(files: Express.Multer.File[]): Promise<OneStreamUploadImageResponse> {
        const CHUNK_SIZE = 64 * 1024; // 64 KB

        const request$ = new Observable<OneStreamUploadImageRequest>(subscriber => {
            for (const file of files) {

                const id = randomUUID();
                // send metadata
                subscriber.next({
                    meta: {
                        file_id: id,
                        file_name: file.originalname,
                        file_type: file.mimetype,
                        total_size: file.buffer.length,
                    },
                });

                // send chunks
                let offset = 0;
                while (offset < file.buffer.length) {
                    const end = Math.min(offset + CHUNK_SIZE, file.buffer.length);
                    const chunk = file.buffer.subarray(offset, end);

                    subscriber.next({
                        chunk: {
                            file_id: id,
                            data: chunk,
                        }
                    });

                    offset = end;
                }
            }
            subscriber.complete();
        });

        return firstValueFrom(this.grpcFileService.oneStreamUploadImage(request$));
    }

}
