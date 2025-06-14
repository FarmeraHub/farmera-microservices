import { Timestamp as GrpcTimestamp } from "@farmera/grpc-proto/dist/common/types"

export class TypesMapper {
    // Convert Date to GrpcTimestamp
    static toGrpcTimestamp(date: Date): GrpcTimestamp | undefined {
        if (!date) return undefined;
        return {
            value: {
                seconds: Math.floor(date.getTime() / 1000),
                nanos: (date.getTime() % 1000) * 1000000,
            },
        };
    }

    // Convert GrpcTimestamp to Date
    static fromGrpcTimestamp(timestamp: GrpcTimestamp): Date {
        if (!timestamp?.value) return new Date();
        return new Date(
            timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
        );
    }
}