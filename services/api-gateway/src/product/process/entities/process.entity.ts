import { ProcessStage } from "src/common/enums/product/process-stage.enum";

export class Process {
    process_id: number;
    product_id?: number;
    stage_name: ProcessStage;
    description: Record<string, string>;
    image_urls: string[];
    video_urls: string[] | null;
    start_date: Date;
    end_date: Date;
    latitude: number;
    longitude: number;
    created: Date;
}