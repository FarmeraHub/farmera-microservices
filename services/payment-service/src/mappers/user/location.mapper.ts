import { Location } from "src/user/entities/location.entity";
import { UserLocation as GrpcUserLocation } from "@farmera/grpc-proto/dist/common/types";
import { TypesMapper } from '../common/types.mapper';
export class LocationMapper {
    static fromGrpcLocation(value: GrpcUserLocation): Location {
        return {
            location_id: value.id,
            name: value.name,
            phone: value.phone,
            city: value.city,
            district: value.district,
            ward: value.ward,
            street: value.street,
            address_line: value.address_line,
            type: value.type,
            is_primary: value.is_primary,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at),
            updated_at: TypesMapper.fromGrpcTimestamp(value.updated_at),
        }
    }
}