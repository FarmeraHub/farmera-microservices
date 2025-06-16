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
  Subcategory as GrpcSubcategory,
  Category as GrpcCategory,
  Identification as GrpcIdentification,
  GetProductResponse,
  ListCategoriesResponse as GrpcListCategoriesResponse,
  CreateSubcategoryResponse as GrpcCreateSubcategoryResponse,
  GetSubcategoryResponse as GrpcGetSubcategoryResponse,
  GetCategoryResponse as GrpcGetCategoryResponse,
  GetAllCategoryWithSubcategoryResponse,
  GetFarmResponse as GrpcGetFarmResponse,
  GetFarmByUserResponse as GrpcGetFarmByUserResponse,
  UpdateFarmStatusResponse as GrpcUpdateFarmStatusResponse,
  CreateFarmRequest,


} from '@farmera/grpc-proto/dist/products/products';
import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Category } from 'src/categories/entities/category.entity';
import { t } from 'pinata/dist/index-CQFQEo3K';
import { FarmRegistrationDto } from 'src/farms/dto/farm-registration.dto';
import { EnumsMapper } from './common/enums.mapper';
import { TypesMapper } from './common/types.mapper';
import { FarmMapper } from './product/farm.mapper';
import { CategoryMapper } from './product/category.mapper';
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
    let farmId = '';
    if (product.farm) {
      if (typeof product.farm === 'string') {
        farmId = product.farm; // Nếu farm là string (chỉ có farm_id)
      } else if (typeof product.farm === 'object' && product.farm.farm_id) {
        farmId = product.farm.farm_id; // Nếu farm là object FarmEntity
      }
    }
    // const grpcProduct: GrpcProduct = {
    //   product_id: product.product_id,
    //   farm_id: farmId,
    //   product_name: product.product_name,
    //   description: product.description,
    //   price_per_unit: product.price_per_unit,
    //   unit: product.unit,
    //   stock_quantity: product.stock_quantity,
    //   weight: product.weight,
    //   image_urls: product.image_urls,
    //   video_urls: product.video_urls,
    //   status: EnumsMapper.toGrpcProductStatus(product.status),
    //   average_rating: product.average_rating,
    //   total_sold: product.total_sold,
    //   created: TypesMapper.toGrpcTimestamp(product.created),
    //   updated: TypesMapper.toGrpcTimestamp(product.updated),
    //   subcategory_details: product.productSubcategoryDetails
    //     ? product.productSubcategoryDetails
    //       .map(detailEntity =>
    //         // Truyền product.product_id vào hàm map chi tiết
    //         this.mapProductSubcategoryDetailEntityToGrpc(detailEntity, product.product_id)
    //       )
    //       .filter((detail): detail is GrpcProductSubcategoryDetail => detail !== undefined)
    //     : [],
    // };

    // return grpcProduct;
  }







  // static mapProductSubcategoryDetailEntityToGrpc(entity: ProductSubcategoryDetail): GrpcProductSubcategoryDetail | undefined {
  //   if (!entity) return undefined;

  //   // Kiểm tra xem các ID cần thiết có tồn tại không, nếu không thì có thể coi là invalid entity
  //   if (entity.id === undefined || entity.product === undefined || entity.subcategory === undefined) {
  //     console.warn("Invalid ProductSubcategoryDetailEntity, missing IDs:", entity);
  //     return undefined; 
  //   }

  //   return {
  //     id: entity.id,
  //     product_id: entity.product.product_id,
  //     subcategory_id: entity.subcategory.subcategory_id,
  //   };

  // }


  // static mapProductSubcategoryDetailEntityToGrpc(
  //   entity: ProductSubcategoryDetail,
  //   productId: number // Nhận product_id từ bên ngoài
  // ): GrpcProductSubcategoryDetail | undefined {
  //   if (!entity) return undefined;

  //   // Bây giờ chúng ta kiểm tra entity.id và entity.subcategory
  //   // product_id đã được cung cấp trực tiếp
  //   if (entity.id === undefined || !entity.subcategory || entity.subcategory.subcategory_id === undefined) {
  //     console.warn("Invalid ProductSubcategoryDetailEntity, missing id or subcategory details:", entity);
  //     return undefined;
  //   }

  //   // Nếu entity.subcategory là một đối tượng Subcategory đầy đủ và bạn chỉ muốn subcategory_id:
  //   const subcategory = entity.subcategory;

  //   // Hoặc nếu entity.subcategory chỉ là subcategory_id (ví dụ: entity.subcategoryId):
  //   // const subcategoryId = entity.subcategoryId; (Cần điều chỉnh tùy theo cấu trúc thực tế của ProductSubcategoryDetailEntity)

  //   // Kiểm tra lại subcategoryId nếu nó có thể undefined từ bước trên
  //   if (!subcategory || subcategory.subcategory_id === undefined) {
  //     console.warn("Invalid ProductSubcategoryDetailEntity, missing subcategory_id:", entity);
  //     return undefined;
  //   }

  //   return {
  //     id: entity.id,
  //     product_id: productId, // Sử dụng productId được truyền vào
  //     subcategory: this.toGrpcSubcategory(subcategory), // Lấy từ entity.subcategory.subcategory_id
  //   };
  // }

  static toGrpcSubcategory(subcategory: Subcategory): GrpcSubcategory | undefined {
    if (!subcategory) {
      return undefined;
    }
    return {
      subcategory_id: subcategory.subcategory_id,
      name: subcategory.name,
      description: subcategory.description,
      category: subcategory.category ? CategoryMapper.toGrpcCategory(subcategory.category) : undefined,
      created: TypesMapper.toGrpcTimestamp(subcategory.created),
    };
  }

  static toGrpcProductResponse(product: Product, Farm?: Farm): GrpcProductResponse {
    const grpcProduct = this.toGrpcProduct(product);
    const grpcFarm = Farm ? FarmMapper.toGrpcFarm(Farm) : undefined;
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

  static toGrpcGetProductResponse(product: any): GetProductResponse {
    const grpcProduct = this.toGrpcProduct(product);
    return {
      product: grpcProduct,
    }
  }
  static toGrpcListCategoriesResponse(categories: Category[]): GrpcListCategoriesResponse {
    const grpcCategories = categories.map(category => {
      return {
        category_id: category.category_id,
        name: category.name,
        description: category.description,
        created: TypesMapper.toGrpcTimestamp(category.created),
        image_url: category.image_url,
      };
    });

    return {
      categories: grpcCategories,
      pagination: {
        current_page: 1, // Giả sử trang hiện tại là 1
        page_size: grpcCategories.length, // Số lượng mục trên trang
        total_items: grpcCategories.length, // Tổng số mục
        total_pages: 1, // Giả sử chỉ có một trang
        has_next_page: false, // Không có trang tiếp theo
        has_previous_page: false, // Không có trang trước
        next_cursor: '',
        previous_cursor: '',
      },

    };
  }

  static toGrpcGetAllCategoryWithSubcategoryResponse(categories: Category[]): GetAllCategoryWithSubcategoryResponse {
    const grpcCategories = categories
      .map(category => CategoryMapper.toGrpcCategory(category))
      .filter((category): category is GrpcCategory => category !== undefined);

    return {
      categories: grpcCategories,
      pagination: {
        current_page: 1, // Giả sử trang hiện tại là 1
        page_size: grpcCategories.length, // Số lượng mục trên trang
        total_items: grpcCategories.length, // Tổng số mục
        total_pages: 1, // Giả sử chỉ có một trang
        has_next_page: false, // Không có trang tiếp theo
        has_previous_page: false, // Không có trang trước
        next_cursor: '',
        previous_cursor: '',
      },
    }
  }
}
