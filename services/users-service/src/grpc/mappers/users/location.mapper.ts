import { Location } from "src/users/entities/location.entity";
import { Location as GrpcLocation } from "@farmera/grpc-proto/dist/common/types";
import { TypesMapper } from "../common/types.mapper";

export class LocationMapper {
    static toGrpcLocation(location: Location): GrpcLocation {
        return {
            id: location.id.toString(),
            user_id: location.user_id.toString(),
            address_line: location.address_line || '',
            city: location.city,
            state: location.district, // Mapping district to state
            postal_code: '', // You may want to add this field
            country: 'Vietnam', // Default or add to entity
            latitude: 0, // You may want to add coordinates
            longitude: 0,
            is_default: location.is_primary,
            created_at: TypesMapper.toGrpcTimestamp(location.created_at),
            updated_at: TypesMapper.toGrpcTimestamp(location.updated_at),
        };
    }
}