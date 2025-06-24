import { Location } from 'src/user/entities/location.entity';
import { Location as GrpcLocation } from "@farmera/grpc-proto/dist/common/types";
import { TypesMapper } from '../common/types.mapper';
export class LocationMapper {
    static fromGrpcLocation(value:  GrpcLocation): Location | undefined {
        if (!value) return undefined;
        return {
            id: Number(value.id),
            city: value.city,
            district: value.state, 
            address_line: value.address_line,
            state: value.state,
            postal_code: value.postal_code,
            country: value.country,
            latitude: value.latitude,
            longitude: value.longitude,
            is_default: value.is_default,
            user_id: value.user_id,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at!),
            updated_at: TypesMapper.fromGrpcTimestamp(value.updated_at!),

        };
    }
}