import { CreateFarmRequest, Farm as GrpcFarm, Address as GrpcAddress, AddressGHN as GrpcAddressGHN, Identification as GrpcIdentification, CreateFarmResponse } from "@farmera/grpc-proto/dist/products/products";
import { FarmRegistrationDto } from "src/farms/dto/farm-registration.dto";
import { Address } from "src/farms/entities/address.entity";
import { Farm } from "src/farms/entities/farm.entity";
import { TypesMapper } from "../common/types.mapper";
import { EnumsMapper } from "../common/enums.mapper";
import { AddressGHN } from "src/farms/entities/address-ghn.entity";
import { Identification } from "src/farms/entities/identification.entity";

export class FarmMapper {
    static fromGrpcCreateFarmRequest(value: CreateFarmRequest): FarmRegistrationDto {
        return {
            farm_name: value.farm_name,
            description: value.description,
            email: value.email,
            phone: value.phone,
            tax_number: value.tax_number,
            city: value.city,
            district: value.district,
            ward: value.ward,
            street: value.street,
            coordinate: value.coordinate,
        }
    }

    static toGrpcFarm(farm: Farm): GrpcFarm {
        return {
            farm_id: farm.farm_id,
            farm_name: farm.farm_name,
            description: farm.description,
            user_id: farm.user_id,
            email: farm.email,
            phone: farm.phone,
            avatar_url: farm.avatar_url,
            profile_image_urls: farm.profile_image_urls,
            certificate_img_urls: farm.certificate_img_urls,
            tax_number: farm.tax_number,
            status: EnumsMapper.toGrpcFarmStatus(farm.status),
            created: TypesMapper.toGrpcTimestamp(farm.created),
            updated: TypesMapper.toGrpcTimestamp(farm.updated),
            address: this.toGrpcFarmAddress(farm.address),
            identification: this.toGrpcFarmIdentification(farm.identification),
            stats: TypesMapper.toGrpcFarmStats(farm.stats),
        }
    }

    static toGrpcFarmAddress(address: Address): GrpcAddress | undefined {
        if (!address) {
            return undefined;
        }
        const addressGhnEntity = address.address_ghn as AddressGHN | undefined; // Ép kiểu
        const addressGhnData = addressGhnEntity
            ? this.toGrpcFarmAddressGhn(addressGhnEntity)
            : undefined;
        return {
            address_id: address.address_id,
            city: address.city,
            district: address.district,
            ward: address.ward,
            street: address.street,
            coordinate: address.coordinate,
            farm_id: address.farm ? address.farm.farm_id : '',
            address_ghn: addressGhnData,
            created: TypesMapper.toGrpcTimestamp(address.created),
        };
    }

    static toGrpcFarmAddressGhn(addressGhn: AddressGHN): GrpcAddressGHN {
        if (!addressGhn) {
            return {
                id: 0,
                province_id: 0,
                district_id: 0,
                ward_code: ''
            };
        }
        return {
            id: addressGhn.id,
            province_id: addressGhn.province_id,
            district_id: addressGhn.district_id,
            ward_code: addressGhn.ward_code
        };
    }
    static toGrpcFarmIdentification(identification: Identification): GrpcIdentification | undefined {
        if (!identification) {
            return undefined;
        }
        return {
            id: identification.id,
            status: EnumsMapper.toGrpcIdentificationStatus(identification.status),
            method: EnumsMapper.toGrpcIdentificationMethod(identification.method),
            nationality: identification.nationality,
            id_number: identification.id_number,
            full_name: identification.full_name,
        };
    }
}