import { Farm as GrpcFarm, Address as GrpcAddress, AddressGHN as GrpcAddressGHN, Identification as GrpcIdentification, VerifyFarmResponse } from "@farmera/grpc-proto/dist/products/products"
import { AddressGHN } from "src/product/farm/entities/address-ghn.entity";
import { Address } from "src/product/farm/entities/address.entity";
import { Farm } from "src/product/farm/entities/farm.entity";
import { Identification } from "src/product/farm/entities/identification.entity";
import { EnumMapper } from "../common/enum.mapper";
import { TypesMapper } from "../common/types.mapper";

export class FarmMapper {
    

    static fromGrpcFarm(value: GrpcFarm): Farm | undefined {
        if (!value) return undefined;
        return {
            farm_id: value.farm_id,
            farm_name: value.farm_name,
            description: value.description,
            user_id: value.user_id,
            email: value.email,
            phone: value.phone,
            avatar_url: value.avatar_url,
            profile_image_urls: value.profile_image_urls,
            certificate_img_urls: value.certificate_img_urls,
            tax_number: value.tax_number,
            status: EnumMapper.fromGrpcFarmStatus(value.status),
            created: TypesMapper.fromGrpcTimestamp(value.created!),
            updated: TypesMapper.fromGrpcTimestamp(value.updated!),
            address: this.fromGrpcFarmAddress(value.address!),
            identification: this.fromGrpcFarmIdentification(value.identification!),
        }
    }

    static fromGrpcFarmAddress(value: GrpcAddress): Address | undefined {
        if (!value) {
            return undefined;
        }
        return {
            address_id: value.address_id,
            city: value.city,
            district: value.district,
            ward: value.ward,
            street: value.street,
            coordinate: value.coordinate,
            address_ghn: this.fromGrpcFarmAddressGhn(value.address_ghn!),
            created: TypesMapper.fromGrpcTimestamp(value.created!),
        };
    }

    static fromGrpcFarmAddressGhn(value: GrpcAddressGHN): AddressGHN | undefined {
        if (!value) {
            return undefined;
        }
        return {
            id: value.id,
            province_id: value.province_id,
            district_id: value.district_id,
            ward_code: value.ward_code
        };
    }

    static fromGrpcFarmIdentification(value: GrpcIdentification): Identification | undefined {
        if (!value) {
            return undefined;
        }
        return {
            id: value.id,
            status: EnumMapper.fromGrpcIdentificationStatus(value.status),
            method: EnumMapper.fromGrpcIdentificationMethod(value.method),
            nationality: value.nationality,
            id_number: value.id_number,
            full_name: value.full_name
        };
    }
}