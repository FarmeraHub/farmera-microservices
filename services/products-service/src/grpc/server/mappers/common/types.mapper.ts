import { Timestamp as GrpcTimestamp } from "@farmera/grpc-proto/dist/common/types";

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
}