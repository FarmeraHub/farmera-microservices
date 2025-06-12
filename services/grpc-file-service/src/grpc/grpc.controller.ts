import { Controller } from '@nestjs/common';
import { FileServiceController, FileServiceControllerMethods, OneStreamUploadImageRequest, OneStreamUploadImageResponse, UploadImageRequest, UploadImageResponse, UploadStatusCode } from "@farmera/grpc-proto/dist/files/files";
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

                            if (total_size == 0) {
                                write_stream.end(() => {
                                    console.log('Write stream closed');
                                    resolve({
                                        message: 'Upload successful',
                                        code: UploadStatusCode.OK,
                                    });
                                });
                            }
                        } else if (chunk.image && write_stream) {
                            // continue upload the chunks
                            received_size += chunk.image.length;
                            write_stream.write(chunk.image);

                            console.log(`received size: ${received_size}/${total_size}`);

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

    async oneStreamUploadImage(request: Observable<OneStreamUploadImageRequest>): Promise<OneStreamUploadImageResponse> {
        return new Promise((resolve, reject) => {
            const fileStreams: Record<string, {
                stream: fs.WriteStream;
                receivedSize: number;
                totalSize: number;
                fileName: string;
            }> = {};

            request.subscribe({
                next: (data) => {
                    try {
                        if (data.meta) {
                            const { file_id, file_name, total_size } = data.meta;
                            if (!file_id) {
                                throw new Error('Missing file_id in metadata');
                            }

                            const uploadPath = path.join(__dirname, '../../Uploads', file_name || `file_${Date.now()}.bin`);
                            const stream = fs.createWriteStream(uploadPath);

                            fileStreams[file_id] = {
                                stream,
                                receivedSize: 0,
                                totalSize: Number(total_size),
                                fileName: file_name,
                            };

                            stream.on('error', (err) => {
                                console.error(`Write stream error for ${file_id}:`, err);
                                reject({
                                    message: 'Failed to write file: ' + err.message,
                                    code: UploadStatusCode.FAILED,
                                });
                            });

                            console.log(`Started receiving file ${file_name} (${file_id})`);

                        } else if (data.chunk) {
                            const { file_id, data: chunkData } = data.chunk;
                            const fileEntry = fileStreams[file_id];

                            if (!fileEntry) {
                                console.warn(`Received chunk for unknown file_id: ${file_id}`);
                                return;
                            }

                            fileEntry.receivedSize += chunkData.length;
                            fileEntry.stream.write(chunkData);

                            // Auto-close if size matches
                            if (fileEntry.receivedSize >= fileEntry.totalSize) {
                                fileEntry.stream.end(() => {
                                    console.log(`Upload completed for file ${fileEntry.fileName}`);
                                    delete fileStreams[file_id]; // Cleanup
                                });
                            }

                        } else {
                            console.warn('Unexpected UploadImageRequest message:', data);
                        }
                    } catch (err) {
                        console.error('Processing error:', err);
                        reject({
                            message: 'Processing error: ' + err.message,
                            code: UploadStatusCode.FAILED,
                        });
                    }
                },
                error: (err) => {
                    console.error('Stream error:', err);
                    // Close all streams on error
                    for (const key in fileStreams) {
                        fileStreams[key].stream.close();
                    }
                    reject({
                        message: 'Stream error: ' + err.message,
                        code: UploadStatusCode.FAILED,
                    });
                },
                complete: () => {
                    console.log('Stream completed');
                    resolve({
                        message: 'All files uploaded successfully',
                        code: UploadStatusCode.OK,
                    });
                }
            });
        });
    }
}