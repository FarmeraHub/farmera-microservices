import { Diary as GrpcDiary } from '@farmera/grpc-proto/dist/products/products';
import { Diary } from 'src/diary/entities/diary.entity';
import { TypesMapper } from '../common/types.mapper';

export class DiaryMapper {
  static toGrpcDiary(value: Diary): GrpcDiary {
    return {
      diary_id: value.diary_id,
      process_id: value.process?.process_id || 0,
      step_name: value.step_name,
      step_description: value.step_description,
      image_urls: value.image_urls ? { list: value.image_urls } : undefined,
      video_urls: value.video_urls ? { list: value.video_urls } : undefined,
      recorded_date: TypesMapper.toGrpcTimestamp(value.recorded_date),
      latitude: value.latitude ?? undefined,
      longitude: value.longitude ?? undefined,
      notes: value.notes ?? undefined,
      created: TypesMapper.toGrpcTimestamp(value.created),
    };
  }
}
