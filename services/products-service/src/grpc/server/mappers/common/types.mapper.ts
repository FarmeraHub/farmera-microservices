import { Timestamp as GrpcTimestamp } from "@farmera/grpc-proto/dist/common/types";
import { BadRequestException } from "@nestjs/common";

export class TypesMapper {
    static toGrpcTimestamp(date: Date): GrpcTimestamp | undefined {
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

    static fromGrpcTimestamp(timestamp: GrpcTimestamp | undefined): Date {
        if (!timestamp?.value) {
            throw new BadRequestException("Invalid timestamp");
        }
        return new Date(
            timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
        );
    }
}