import { CreateFarmRequest, CreateFarmResponse, Farm as GrpcFarm, Address as GrpcAddress, AddressGHN as GrpcAddressGHN, Identification as GrpcIdentification, VerifyFarmResponse } from "@farmera/grpc-proto/dist/products/products"
import { FarmRegistrationDto } from "src/product/farm/dto/farm-registration.dto"
import { Farm } from "src/product/farm/entities/farm.entity"
import { EnumMapper } from "../common/enum.mapper"
import { TypesMapper } from "../common/types.mapper"
import { Address } from "src/product/farm/entities/address.entity"
import { AddressGHN } from "src/product/farm/entities/address-ghn.entity"
import { Identification } from "src/product/farm/entities/identification.entity"

export class FarmMapper {
    static toGrpcCreateFarmRequest(dto: FarmRegistrationDto, user_id: string): CreateFarmRequest {
        return {
            farm_name: dto.farm_name,
            description: dto.description,
            email: dto.email,
            phone: dto.phone,
            tax_number: dto.tax_number,
            city: dto.city,
            district: dto.district,
            ward: dto.ward,
            street: dto.street,
            coordinate: dto.coordinate,
            user_id: user_id
        }
    }

    static fromGrpcFarm(value: GrpcFarm): Farm {
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
            created: TypesMapper.fromGrpcTimestamp(value.created),
            updated: TypesMapper.fromGrpcTimestamp(value.updated),
            address: this.fromGrpcFarmAddress(value.address),
            identification: this.fromGrpcFarmIdentification(value.identification),
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
            address_ghn: this.fromGrpcFarmAddressGhn(value.address_ghn),
            created: TypesMapper.fromGrpcTimestamp(value.created),
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