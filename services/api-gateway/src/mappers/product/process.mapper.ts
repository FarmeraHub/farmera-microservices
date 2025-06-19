import { ProductProcess, ProductProcessLite } from "@farmera/grpc-proto/dist/products/products";
import { Process } from "src/product/process/entities/process.entity";
import { TypesMapper } from "../common/types.mapper";
import { EnumMapper } from "../common/enum.mapper";

export class ProcessMapper {
    static fromGrpcProcess(value: ProductProcess): Process | undefined {
        if (!value) return undefined;
        return {
            process_id: value.process_id,
            product_id: value.product_id,
            stage_name: EnumMapper.fromGrpcProcessStage(value.stage_name),
            description: value.description,
            image_urls: value.image_urls,
            video_urls: value.video_urls ? value.video_urls.list : undefined,
            start_date: TypesMapper.fromGrpcTimestamp(value.start_date),
            end_date: TypesMapper.fromGrpcTimestamp(value.end_date),
            latitude: value.latitude,
            longitude: value.longitude,
            created: TypesMapper.fromGrpcTimestamp(value.created),
        }
    }

    static fromGrpcProcessLite(value: ProductProcessLite): Process | undefined {
        if (!value) return undefined;
        return {
            process_id: value.process_id,
            stage_name: EnumMapper.fromGrpcProcessStage(value.stage_name),
            description: value.description,
            image_urls: value.image_urls,
            video_urls: value.video_urls ? value.video_urls.list : undefined,
            start_date: TypesMapper.fromGrpcTimestamp(value.start_date),
            end_date: TypesMapper.fromGrpcTimestamp(value.end_date),
            latitude: value.latitude,
            longitude: value.longitude,
            created: TypesMapper.fromGrpcTimestamp(value.created),
        }
    }

}