import { Location } from 'src/users/entities/location.entity';
import { Location as GrpcLocation } from '@farmera/grpc-proto/dist/common/types';
import { TypesMapper } from '../common/types.mapper';

export class LocationMapper {
  static toGrpcLocation(location: Location): GrpcLocation {
    return {
      id: location.id.toString(),
      user_id: location.user_id,
      name: location.name || '',
      phone: location.phone || '',
      address_line: location.address_line || '',
      city: location.city,
      state: location.state || '',
      district: location.district || '',
      ward: location.ward || '',
      street: location.street || '',
      postal_code: location.postal_code || '',
      country: location.country || 'VN', // Default country code
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
      is_primary: location.is_primary,
      created_at: TypesMapper.toGrpcTimestamp(location.created_at),
      updated_at: TypesMapper.toGrpcTimestamp(location.updated_at),
    };
  }
}
