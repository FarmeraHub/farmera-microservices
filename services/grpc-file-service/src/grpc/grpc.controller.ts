import { Controller } from '@nestjs/common';
import { FileServiceController, FileServiceControllerMethods, UploadImageRequest, UploadImageResponse, UploadStatusCode } from "@farmera/grpc-proto/dist/files/files";
import { Observable } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

@Controller('grpc')
@FileServiceControllerMethods()
export class GrpcController implements FileServiceController {
    async uploadImage(request: Observable<UploadImageRequest>): Promise<UploadImageResponse> {
        return new Promise((resolve, reject) => {
            let file_name = `uploaded_${Date.now()}.bin`;
            let write_stream: fs.WriteStream | null = null;
            let receive_meta = false;
            let total_size = 0;
            let received_size = 0;

            request.subscribe({
                next: (chunk) => {
                    try {
                        if (chunk.meta && !receive_meta) {
                            console.log('Received meta:', chunk.meta);
                            receive_meta = true;
                            file_name = chunk.meta.file_name || file_name;
                            total_size = chunk.meta.total_size;

                            // start to upload
                            const uploadPath = path.join(__dirname, '../../Uploads', file_name);
                            write_stream = fs.createWriteStream(uploadPath);
                            write_stream.on('error', (err) => {
                                console.error('Write stream error:', err.message);
                                reject({
                                    message: 'Failed to write file: ' + err.message,
                                    code: UploadStatusCode.FAILED,
                                });
                            });
                        } else if (chunk.image && write_stream) {
                            // continue upload the chunks
                            received_size += chunk.image.length;
                            write_stream.write(chunk.image);

                            // handle complete with file size due to receive complete event error
                            if (received_size >= total_size) {
                                write_stream.end(() => {
                                    console.log('Write stream closed');
                                    resolve({
                                        message: 'Upload successful',
                                        code: UploadStatusCode.OK,
                                    });
                                });
                            }
                        } else {
                            console.warn('Unexpected chunk or missing write stream:', chunk);
                        }
                    } catch (err) {
                        console.error('Error processing chunk:', err);
                        reject({
                            message: 'Error processing chunk: ' + err.message,
                            code: UploadStatusCode.FAILED,
                        });
                    }
                },

                // handle stream error
                error: (err) => {
                    console.error('Stream error:', err);
                    if (write_stream) {
                        write_stream.close();
                    }
                    reject({
                        message: 'Failed to upload: ' + err.message,
                        code: UploadStatusCode.FAILED,
                    });
                },

                // ERROR: can not receive the complete event !!!???
                complete: () => {
                    console.log('Stream completed');
                    if (write_stream) {
                        write_stream.end(() => {
                            console.log('Write stream closed');
                            resolve({
                                message: 'Upload successful',
                                code: UploadStatusCode.OK,
                            });
                        });
                    } else {
                        console.warn('No write stream created');
                        resolve({
                            message: 'No data received',
                            code: UploadStatusCode.FAILED,
                        });
                    }
                },
            });
        });
    }
}