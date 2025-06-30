import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
    UsersServiceClient,
    GetUserLocationsResponse
} from "@farmera/grpc-proto/dist/users/users";
import { ClientGrpc } from "@nestjs/microservices";
import { Location } from "../../user/entities/location.entity";
import { firstValueFrom, map } from "rxjs";
import { LocationMapper } from "src/mappers/user/location.mapper";
import { ErrorMapper } from "src/mappers/common/error.mapper";
import { UserMapper } from "src/mappers/user/user.mapper";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class UserGrpcClientService implements OnModuleInit {
    private readonly logger = new Logger(UserGrpcClientService.name);
    private userGrpcService: UsersServiceClient;
    constructor(
        @Inject("USERS_PACKAGE") private client: ClientGrpc
    ) { }

    onModuleInit() {
        this.userGrpcService = this.client.getService<UsersServiceClient>("UsersService");
    }

    async getUser(userId: string): Promise<User> {
        try {
            const result = await firstValueFrom(this.userGrpcService.getUser({
                user_id: userId,
                include_locations: true,
                include_payment_methods: true
            }));
            if (!result || !result.user) {
                throw new Error(`User with ID ${userId} not found or gRPC result is malformed`);
            }
            const user = UserMapper.fromGrpcUser(result.user);
            if (!user) {
                throw new Error(`User mapping failed for ID ${userId}`);
            }
            return user;
        } catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
    async getLocationById(LocationId: string): Promise<Location> {
        try {
            const result = await firstValueFrom(this.userGrpcService.getLocationById({ id: LocationId }));
            if (!result || !result.location) {
                throw new Error(`Location with ID ${LocationId} not found or gRPC result is malformed`);
            }
            this.logger.log(`Location with ID ${LocationId} found: ${JSON.stringify(result.location)}`);

            const location = LocationMapper.fromGrpcLocation(result.location);
            if (!location) {
                throw new Error(`Location mapping failed for ID ${LocationId}`);
            }
            return location;
        }
        catch (err) {
            this.logger.error(err.message);
            throw ErrorMapper.fromGrpcError(err);
        }
    }
}