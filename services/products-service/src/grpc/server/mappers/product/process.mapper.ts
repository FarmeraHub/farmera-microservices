import { ProductProcess, ProductProcessLite } from "@farmera/grpc-proto/dist/products/products";
import { Process } from "src/process/entities/process.entity";
import { TypesMapper } from "../common/types.mapper";
import { EnumsMapper } from "../common/enums.mapper";

export class ProcessMapper {
    static toGrpcProcess(value: Process): ProductProcess {
        return {
            process_id: value.process_id,
            product_id: value.product.product_id,
            stage_name: EnumsMapper.toGrpcProcessStage(value.stage_name),
            description: value.description,
            image_urls: value.image_urls,
            video_urls: value.video_urls ? { list: value.video_urls } : undefined,
            start_date: TypesMapper.toGrpcTimestamp(new Date(value.start_date)),
            end_date: TypesMapper.toGrpcTimestamp(new Date(value.end_date)),
            latitude: value.latitude,
            longitude: value.longitude,
            created: TypesMapper.toGrpcTimestamp(value.created),
        }
    }

    static toGrpcProcessLite(value: Process): ProductProcessLite {
        return {
            process_id: value.process_id,
            stage_name: EnumsMapper.toGrpcProcessStage(value.stage_name),
            description: value.description,
            image_urls: value.image_urls,
            video_urls: value.video_urls ? { list: value.video_urls } : undefined,
            start_date: TypesMapper.toGrpcTimestamp(new Date(value.start_date)),
            end_date: TypesMapper.toGrpcTimestamp(new Date(value.end_date)),
            latitude: value.latitude,
            longitude: value.longitude,
            created: TypesMapper.toGrpcTimestamp(value.created),
        }
    }
}