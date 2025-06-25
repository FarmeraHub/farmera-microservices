import { User as GrpcUser, ProfileStats as GrpcProfileStats } from "@farmera/grpc-proto/dist/users/users";
import { User } from "src/user/user/entities/user.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";
import { LocationMapper } from "./location.mapper";
import { PaymentMapper } from "./payment.mapper";
import { ProfileStats } from "src/user/user/entities/profilestats.entity";

export class UserMapper {
    static fromGrpcUser(grpcUser: GrpcUser): User {
        return {
            id: grpcUser.id,
            email: grpcUser.email,
            phone: grpcUser.phone,
            first_name: grpcUser.first_name,
            last_name: grpcUser.last_name,
            farm_id: grpcUser.farm_id,
            gender: EnumMapper.fromGrpcGender(grpcUser.gender),
            avatar: grpcUser.avatar_url,
            birthday: TypesMapper.fromGrpcTimestamp(grpcUser.birthday),
            role: EnumMapper.fromGrpcUserRole(grpcUser.role),
            points: grpcUser.points,
            status: EnumMapper.fromGrpcUserStatus(grpcUser.status),
            locations: grpcUser.locations ? grpcUser.locations.locations.map(location => LocationMapper.fromGrpcLocation(location)) : undefined,
            payment_methods: grpcUser.payment_methods ? grpcUser.payment_methods.payment_methods.map(paymentMethod => PaymentMapper.fromGrpcPaymentMethod(paymentMethod)) : undefined,
            created_at: TypesMapper.fromGrpcTimestamp(grpcUser.created_at),
            updated_at: TypesMapper.fromGrpcTimestamp(grpcUser.updated_at),
        }
    }

    static fromGrpcProfileStats(grpcProfileStats: GrpcProfileStats): ProfileStats {
        return {
            total_orders: grpcProfileStats.total_orders,
            total_reviews: grpcProfileStats.total_reviews,
            loyalty_points: grpcProfileStats.loyalty_points,
            total_spent: grpcProfileStats.total_spent,
            member_since: TypesMapper.fromGrpcTimestamp(grpcProfileStats.member_since),
        }
    }
}