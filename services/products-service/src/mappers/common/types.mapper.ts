import { GeoLocation as GrpcGeoLocation, Timestamp as GrpcTimestamp, ProductOptions as GrpcProductOptions, FarmStats as GrpcFarmStats } from "@farmera/grpc-proto/dist/common/types";
import { BadRequestException } from "@nestjs/common";
import { FarmStats } from "src/farms/dto/farm-stats.dto";
import { GeoLocation } from "src/farms/dto/search-farm.dto";
import { ProductOptions } from "src/products/dto/product-options.dto";

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

    static fromGrpcTimestamp(timestamp: GrpcTimestamp | undefined): Date {
        if (!timestamp?.value) {
            throw new BadRequestException("Invalid timestamp");
        }
        return new Date(
            timestamp.value.seconds * 1000 + timestamp.value.nanos / 1000000,
        );
    }

    static fromGrpcGeoLocation(value: GrpcGeoLocation | undefined): GeoLocation | undefined {
        if (!value) return undefined;
        return {
            latitude: value.latitude,
            longitude: value.longitude,
            radius_km: value.radius_km,
        }
    }

    static fromGrpcProductOptions(value: GrpcProductOptions | undefined): ProductOptions | undefined {
        if (!value) return undefined;
        return {
            include_farm: value.include_farm,
            include_processes: value.include_processes,
            include_categories: value.include_categories,
            include_farm_address: value.include_farm_address,
            include_farm_stats: value.include_farm_stats
        }
    }

    static toGrpcFarmStats(value: FarmStats | undefined): GrpcFarmStats | undefined {
        if (!value) return undefined;
        return {
            average_rating: value.averageRating,
            sold_count: value.soldCount,
            products_count: value.productCount,
            followers_count: value.followersCount,
        }
    }
}