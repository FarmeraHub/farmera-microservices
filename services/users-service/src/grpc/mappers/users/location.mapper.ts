import { Location } from "src/users/entities/location.entity";
import { UserLocation as GrpcUserLocation } from "@farmera/grpc-proto/dist/common/types";
import { TypesMapper } from "../common/types.mapper";

export class LocationMapper {
  static toGrpcLocation(location: Location): GrpcUserLocation {
    return {
      id: location.location_id,
      name: location.name,
      phone: location.phone,
      city: location.city,
      district: location.district,
      ward: location.ward,
      street: location.street,
      address_line: location.address_line,
      type: location.type,
      is_primary: location.is_primary,
      created_at: TypesMapper.toGrpcTimestamp(location.created_at),
      updated_at: TypesMapper.toGrpcTimestamp(location.updated_at),
    };
  }
}
