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
  GetListProductsResponse as GrpcGetListProductsResponse,
  ProductRequest,
  ProductResponse as GrpcProductResponse,
  Product as GrpcProduct,
  Farm as GrpcFarm,
  Address as GrpcAddress,
  AddressGHN as GrpcAddressGHN,
  ProductSubcategoryDetail as GrpcProductSubcategoryDetail,
  Identification as GrpcIdentification,
} from '@farmera/grpc-proto/dist/products/products';
import { CommonMapper } from "./common.mapper";
export class ProductMapper {



  static toGpcProductRequest(productRequest: any): ProductRequest {
    return {
      product_id: productRequest.product_id || '',
      farm_id: productRequest.farm_id || '',
      product_name: productRequest.product_name || '',
    }
  }
  static toGrpcGetListProductRequest(productRequest: any): GetListProductsRequest {
    if (!productRequest || !Array.isArray(productRequest.products)) {
      throw new BadGatewayException('Invalid request format: "products" array is required.');
    }

    const products: ProductRequest[] = productRequest.products.map((product: any) => ({
      product_id: product.product_id || '',
      farm_id: product.farm_id || '',
      product_name: product.product_name || '',
    }));

    return { products };

  }
  static toGrpcProduct(product: Product): GrpcProduct | undefined {
    if (!product) { return undefined; } 
    const farmEntity = product.farm as Farm | undefined;
    const grpcProduct: GrpcProduct = {
      product_id: product.product_id,
      farm_id: farmEntity ? farmEntity.farm_id : '',
      product_name: product.product_name,
      description: product.description,
      price_per_unit: product.price_per_unit,
      unit: product.unit,
      stock_quantity: product.stock_quantity,
      weight: product.weight,
      image_urls: product.image_urls,
      video_urls: product.video_urls,
      status: CommonMapper.toGrpcProductStatus(product.status),
      average_rating: product.average_rating,
      total_sold: product.total_sold,
      created: CommonMapper.toGrpcTimestamp(product.created),
      updated: CommonMapper.toGrpcTimestamp(product.updated),
      subcategory_details: product.productSubcategoryDetails
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
      status: CommonMapper.toGrpcFarmStatus(farm.status),
      created: CommonMapper.toGrpcTimestamp(farm.created),
      updated: CommonMapper.toGrpcTimestamp(farm.updated),
      address: this.toGrpcFarmAddress(farm.address),
      identification: this.toGrpcFarmIdentification(farm.identification),

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
      created: CommonMapper.toGrpcTimestamp(address.created),
    };
  }

  static toGrpcFarmAddressGhn(addressGhn: AddressGHN): GrpcAddressGHN  {
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
      status: CommonMapper.toGrpcIdentificationStatus(identification.status),
      method: CommonMapper.toGrpcIdentificationMethod(identification.method),
      nationality: identification.nationality,
      id_number: identification.id_number,
      full_name: identification.full_name,
    };
  }

  static mapProductSubcategoryDetailEntityToGrpc(entity: any): GrpcProductSubcategoryDetail | undefined {
    if (!entity) return undefined;

    // Chỉ map các ID theo định nghĩa của GrpcProductSubcategoryDetail
    return {
      id: entity.id,
      product_id: entity.product_id, // Map từ product_id của entity
      subcategory_id: entity.subcategory_id, // Map từ subcategory_id của entity
    };
  }

  static toGrpcProductResponse(product: Product, Farm?: Farm): GrpcProductResponse {
    const grpcProduct = this.toGrpcProduct(product);
    const grpcFarm = Farm ? this.toGrpcFarm(Farm) : undefined;
    return {
      product: grpcProduct,
      farm: grpcFarm,
    };
   
  }
  static toGrpcGetListProductsResponse(productResponseItems: GrpcProductResponse[]): GrpcGetListProductsResponse {
    return {
      products_found: productResponseItems || [],
    }


  }
}
