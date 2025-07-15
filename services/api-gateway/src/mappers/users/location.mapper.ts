import { UserLocation as GrpcUserLocation } from "@farmera/grpc-proto/dist/common/types";
import { TypesMapper } from "../common/types.mapper";
import { Location } from "src/user/user/entities/location.entity";

export class LocationMapper {
    static toGrpcLocation(location: Location): GrpcUserLocation {
        return {
            id: location.location_id,
            city: location.city,
            district: location.district,
            ward: location.ward,
            street: location.street,
            address_line: location.address_line,
            type: location.type,
            is_primary: location.is_primary,
            created_at: TypesMapper.toGrpcTimestamp(location.created_at),
            updated_at: TypesMapper.toGrpcTimestamp(location.updated_at),
            name: location.name,
            phone: location.phone,
        };
    }

    static fromGrpcLocation(value: GrpcUserLocation): Location {
        return {
            location_id: value.id,
            city: value.city,
            district: value.district,
            ward: value.ward,
            street: value.street,
            address_line: value.address_line,
            type: value.type,
            is_primary: value.is_primary,
            phone: value.phone,
            name: value.name,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at),
            updated_at: TypesMapper.fromGrpcTimestamp(value.updated_at),
        }
    }
}