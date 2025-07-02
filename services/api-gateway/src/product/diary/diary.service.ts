import { ProductsServiceClient } from '@farmera/grpc-proto/dist/products/products';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { firstValueFrom } from 'rxjs';
import { TypesMapper } from '../../mappers/common/types.mapper';

@Injectable()
export class DiaryService implements OnModuleInit {
  private readonly logger = new Logger(DiaryService.name);
  private productGrpcService: ProductsServiceClient;

  constructor(@Inject('PRODUCTS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.productGrpcService =
      this.client.getService<ProductsServiceClient>('ProductsService');
  }

  async createDiary(userId: string, createDiaryDto: CreateDiaryDto) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.createDiary({
          user_id: userId,
          process_id: createDiaryDto.process_id,
          step_name: createDiaryDto.step_name,
          step_description: createDiaryDto.step_description,
          image_urls: createDiaryDto.image_urls
            ? {
                list: createDiaryDto.image_urls,
              }
            : undefined,
          video_urls: createDiaryDto.video_urls
            ? {
                list: createDiaryDto.video_urls,
              }
            : undefined,
          recorded_date: TypesMapper.toGrpcTimestamp(
            createDiaryDto.recorded_date,
          ),
          latitude: createDiaryDto.latitude,
          longitude: createDiaryDto.longitude,
          notes: createDiaryDto.notes,
        }),
      );
      return result;
    } catch (err) {
      this.logger.error(`[createDiary] ${err.message}`);
      throw err;
    }
  }

  async getDiariesByProcess(processId: number) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getDiariesByProcess({
          process_id: processId,
        }),
      );
      return result;
    } catch (err) {
      this.logger.error(`[getDiariesByProcess] ${err.message}`);
      throw err;
    }
  }

  async getDiary(diaryId: number) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.getDiary({
          diary_id: diaryId,
        }),
      );
      return result;
    } catch (err) {
      this.logger.error(`[getDiary] ${err.message}`);
      throw err;
    }
  }

  async updateDiary(userId: string, updateDiaryDto: UpdateDiaryDto) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.updateDiary({
          user_id: userId,
          diary_id: updateDiaryDto.diary_id,
          step_name: updateDiaryDto.step_name,
          step_description: updateDiaryDto.step_description,
          image_urls: updateDiaryDto.image_urls
            ? {
                list: updateDiaryDto.image_urls,
              }
            : undefined,
          video_urls: updateDiaryDto.video_urls
            ? {
                list: updateDiaryDto.video_urls,
              }
            : undefined,
          recorded_date: updateDiaryDto.recorded_date
            ? TypesMapper.toGrpcTimestamp(updateDiaryDto.recorded_date)
            : undefined,
          latitude: updateDiaryDto.latitude,
          longitude: updateDiaryDto.longitude,
          notes: updateDiaryDto.notes,
        }),
      );
      return result;
    } catch (err) {
      this.logger.error(`[updateDiary] ${err.message}`);
      throw err;
    }
  }

  async deleteDiary(userId: string, diaryId: number) {
    try {
      const result = await firstValueFrom(
        this.productGrpcService.deleteDiary({
          user_id: userId,
          diary_id: diaryId,
        }),
      );
      return result;
    } catch (err) {
      this.logger.error(`[deleteDiary] ${err.message}`);
      throw err;
    }
  }
}
