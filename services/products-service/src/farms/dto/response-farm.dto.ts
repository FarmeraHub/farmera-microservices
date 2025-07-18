import { status } from '@grpc/grpc-js';
export class ResponseFarmDto {
    farm_id: string;
    farm_name: string;
    city: string;
    avatar: string;
    description: string;
    profile_image: string[];
    certificate: string[];
    status: string;
    created: Date;
    constructor(partial: Partial<ResponseFarmDto>) {
        Object.assign(this, partial);
    }
}