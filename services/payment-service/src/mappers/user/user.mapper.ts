import { User } from "src/user/entities/user.entity";
import { EnumMapper } from "../common/enum.mapper";
import { User as GrpcUser } from "@farmera/grpc-proto/dist/users/users";
import { TypesMapper } from "../common/types.mapper";
import { LocationMapper } from "./location.mapper";
import { PaymentMethodMapper } from "./payment-method.mapper";

export class UserMapper {
    static fromGrpcUser(value: GrpcUser): User | undefined {
        if (!value) return undefined;
        return {
            id: value.id,
            email: value.email,
            phone: value.phone,
            first_name: value.first_name,
            last_name: value.last_name,
            farm_id: value.farm_id,
            gender: EnumMapper.fromGrpcGender(value.gender),
            avatar: value.avatar_url,
            birthday: TypesMapper.fromGrpcTimestamp(value.birthday!),
            role: EnumMapper.fromGrpcUserRole(value.role),
            points: value.points,
            status: EnumMapper.fromGrpcUserStatus(value.status),
            locations: value.locations ? value.locations.locations.map(location => LocationMapper.fromGrpcLocation(location)) : undefined,
            payment_methods: value.payment_methods ? value.payment_methods.payment_methods.map(paymentMethod => PaymentMethodMapper.fromGrpcPaymentMethod(paymentMethod)) : undefined,
            created_at: TypesMapper.fromGrpcTimestamp(value.created_at!) || new Date(),
            updated_at: TypesMapper.fromGrpcTimestamp(value.updated_at!) || new Date(),

        };
    }
}