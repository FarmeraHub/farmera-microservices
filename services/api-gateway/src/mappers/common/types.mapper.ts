import { Timestamp as GrpcTimestamp } from "@farmera/grpc-proto/dist/common/types"

export class TypesMapper {
    // Convert Date to GrpcTimestamp
    static toGrpcTimestamp(date: Date | string | undefined | null): GrpcTimestamp | undefined {
        if (!date) return undefined;

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }

        return {
            value: {
                seconds: Math.floor(dateObj.getTime() / 1000),
                nanos: (dateObj.getTime() % 1000) * 1000000,
            },
        };
    }


    // Convert GrpcTimestamp to Date
    static fromGrpcTimestamp(timestamp: GrpcTimestamp): Date | undefined {
        if (!timestamp?.value) return undefined;
        return new Date(
            timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
        );
    }
}