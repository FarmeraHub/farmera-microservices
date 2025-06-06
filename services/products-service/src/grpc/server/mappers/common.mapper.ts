import {
    ProductStatus,
    FarmStatus,
    IdentificationMethod,
    IdentificationStatus,
} from "@farmera/grpc-proto/dist/common/enums";
import { Timestamp } from "@farmera/grpc-proto/dist/common/types";


export class CommonMapper {
    static toGrpcTimestamp(date: Date): Timestamp | undefined {
        if (!date) {
            return undefined;
        }
        return {
            value: {
                seconds: Math.floor(date.getTime() / 1000),
                nanos: (date.getTime() % 1000) * 1000000,
            },
        };
    }
    static toGrpcProductStatus(status: string): ProductStatus {
        switch (status) {
            case 'PRE_ORDER':
                return 1;
            case 'NOT_YET_OPEN':
                return 2;
            case 'OPEN_FOR_SALE':
                return 3;
            case 'SOLD_OUT':
                return 4;
            case 'CLOSED':
                return 5;
            case 'DELETED':
                return 6;
            default:
                return 0;
        }
    }

    static toGrpcFarmStatus(status: string): FarmStatus {
        switch (status) {
            case 'PENDING':
                return 1;
            case 'APPROVED':
                return 2;
            case 'BLOCKED':
                return 3;
            case 'REJECTED':
                return 4;
            default:
                return 0;
        }
    }
    static toGrpcIdentificationMethod(method: string): IdentificationMethod {
        switch (method) {
            case 'NATIONAL_ID':
                return 1;
            case 'PASSPORT':
                return 2;
            case 'DRIVER_LICENSE':
                return 3;
            default:
                return 0;
        }
    }
    static toGrpcIdentificationStatus(status: string): IdentificationStatus {
        switch (status) {
            case 'PENDING':
                return 1;
            case 'APPROVED':
                return 2;
            case 'REJECTED':
                return 3;
            default:
                return 0;
        }
    }



}