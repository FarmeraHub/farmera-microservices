import { Identification } from './../../../farms/entities/identification.entity';
import { AddressDtoGrpcResponse, AddressGhnDtoGrpcResponse, FarmDtoGrpcResponse, ProductDtoGrpcResponse } from "../dto/response/grpc.response.dto";
import { Product } from "src/products/entities/product.entity";
import { Farm } from "src/farms/entities/farm.entity";
import { Address } from "src/farms/entities/address.entity";
import { AddressGHN } from "src/farms/entities/address-ghn.entity";
import { BadGatewayException } from "@nestjs/common";
import {
  ProductsServiceControllerMethods,
  ProductsServiceController,
  GetListProductsRequest,
  GetListProductsResponse,
  ProductRequest,
  ProductResponse,
  Product as GrpcProduct,
  Farm as GrpcFarm,
  Address as GrpcAddress,
  AddressGHN as GrpcAddressGHN,
  ProductSubcategoryDetail as GrpcProductSubcategoryDetail,
} from '@farmera/grpc-proto/dist/products/products';
import { CommonMapper } from "./common.mapper";
export class ProductMapper {


  static toGrpcProduct(product: Product): GrpcProduct {
    const farmEntity = product.farm as Farm | undefined;
    const grpcProduct: GrpcProduct = {
      productId: product.product_id,
      farmId: farmEntity ? farmEntity.farm_id : '',
      productName: product.product_name,
      description: product.description,
      pricePerUnit: product.price_per_unit,
      unit: product.unit,
      stockQuantity: product.stock_quantity,
      weight: product.weight,
      imageUrls: product.image_urls,
      videoUrls: product.video_urls,
      status: CommonMapper.toGrpcProductStatus(product.status),
      averageRating: product.average_rating,
      totalSold: product.total_sold,
      createdAt: CommonMapper.toGrpcTimestamp(product.created),
      updatedAt: CommonMapper.toGrpcTimestamp(product.updated),
      subcategoryDetails: product.productSubcategoryDetails
        ? product.productSubcategoryDetails
          .map(detailEntity => this.mapProductSubcategoryDetailEntityToGrpc(detailEntity))
          .filter(Boolean) as GrpcProductSubcategoryDetail[]
        : [],
    };

    return grpcProduct;
  }

  static toGrpcFarm(farm: Farm): GrpcFarm | undefined {
    if (!farm) {
      return undefined;
    }
    const addressEntity = farm.address as Address | undefined;
    const identificationEntity = farm.identification as Identification | undefined;


    return {
      farmId: farm.farm_id,
      farmName: farm.farm_name,
      description: farm.description,
      userId: farm.user_id,
      email: farm.email,
      phone: farm.phone,
      avatarUrl: farm.avatar_url,
      profileImageUrls: farm.profile_image_urls,
      certificateImgUrls: farm.certificate_img_urls,
      taxNumber: farm.tax_number,
      status: CommonMapper.toGrpcFarmStatus(farm.status),
      created: CommonMapper.toGrpcTimestamp(farm.created),
      updated: CommonMapper.toGrpcTimestamp(farm.updated),
      addressId: Number(addressEntity?.address_id) || 0,
      identificationId: identificationEntity?.id || '',

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
      addressId: address.address_id,
      city: address.city,
      district: address.district,
      ward: address.ward,
      street: address.street,
      coordinate: address.coordinate,
      farmId: address.farm.farm_id,
      addressGhn: addressGhnData,
      created: CommonMapper.toGrpcTimestamp(address.created),
    };
  }

  static toGrpcFarmAddressGhn(addressGhn: AddressGHN): GrpcAddressGHN | undefined {
    if (!addressGhn) {
      return undefined;
    }
    return {
      id: addressGhn.id,
      provinceId: addressGhn.province_id,
      districtId: addressGhn.district_id,
      wardCode: addressGhn.ward_code
    };
  }


  static mapProductSubcategoryDetailEntityToGrpc(entity: any): GrpcProductSubcategoryDetail | undefined {
    if (!entity) return undefined;

    // Chỉ map các ID theo định nghĩa của GrpcProductSubcategoryDetail
    return {
      id: entity.id,
      productId: entity.product_id, // Map từ product_id của entity
      subcategoryId: entity.subcategory_id, // Map từ subcategory_id của entity
    };
  }

  static toGrpcProductResponse(product: GrpcProduct, Farm: GrpcFarm): ProductResponse {
    return {
      product: product,
      farm: Farm,
    };
  }
  static toGrpcGetListProductsResponse(productEntities: Product[]): GetListProductsResponse {

    if (!productEntities || productEntities.length === 0) {
      return { products: [] };
    }

    const mappedProductResponses: ProductResponse[] = [];

    for (const entity of productEntities) {
      if (!entity) {
        console.warn("mapProductEntityListToFullGrpcResponse encountered an undefined entity in the list.");
        continue;
      }

      // 1. Map ProductEntity sang GrpcProduct
      const grpcProduct = this.toGrpcProduct(entity);

      // 2. Map FarmEntity (nếu có trong ProductEntity) sang GrpcFarm
      // Giả sử ProductEntity có trường 'farm' kiểu FarmEntity đã được load
      const grpcFarm = entity.farm ? this.toGrpcFarm(entity.farm) : undefined;

      // 3. Tạo đối tượng ProductResponse
      const productResponse: ProductResponse = {
        product: grpcProduct,
        farm: grpcFarm,
      };

      // 4. Push ProductResponse đã map vào mảng kết quả
      mappedProductResponses.push(productResponse);
    }

    // 5. Tạo đối tượng GetListProductsResponse cuối cùng
    return {
      products: mappedProductResponses,
    };
  }
}
