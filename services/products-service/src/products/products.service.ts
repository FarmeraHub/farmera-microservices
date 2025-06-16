import { Subcategory } from 'src/categories/entities/subcategory.entity';
import { Farm } from './../farms/entities/farm.entity';
import { CategoriesService } from './../categories/categories.service';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { DataSource, In, Repository } from "typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { FarmsService } from 'src/farms/farms.service';
import { FarmStatus } from 'src/common/enums/farm-status.enum';
import { ResponseProductDto } from './dto/response/response-product.dto';
import { ResponseFarmDto } from 'src/farms/dto/response-farm.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationOptions } from 'src/pagination/dto/pagination-options.dto';
import { PaginationResult } from 'src/pagination/dto/pagination-result.dto';
import { PaginationMeta } from 'src/pagination/dto/pagination-meta.dto';
import { AzureBlobService } from 'src/services/azure-blob.service';
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
  ) { }
  async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const farm = await this.farmRepository.findOne({ where: { user_id: userId } });

    if (!farm) { throw new BadRequestException('Farm không tồn tại'); }
    if ('status' in farm && farm.status !== FarmStatus.APPROVED) {
      throw new BadRequestException('Farm chưa được duyệt');
    }

    try {
      const { subcategory_ids, ...temp_product } = createProductDto;

      const product = this.productsRepository.create(temp_product);
      product.farm = farm;

      if (subcategory_ids && subcategory_ids.length > 0) {
        const subcategories = await this.subcategoryRepository.find({ where: { subcategory_id: In(subcategory_ids) } });
        if (subcategories.length !== subcategory_ids.length) {
          throw new BadRequestException('Some subcategories not found');
        }
        product.subcategories = subcategories;
      }

      return this.productsRepository.save(product);

    } catch (error) {
      throw new InternalServerErrorException(`Không thể tạo sản phẩm: ${error.message}`);
    }
  }

  async deleteProduct(productId: number, userId: string): Promise<boolean> {
    const farm = await this.farmRepository.findOne({ select: ["status", "user_id"], where: { user_id: userId } });
    if (!farm) { throw new NotFoundException('Farm không tồn tại'); }

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      relations: ['farm'],
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    if (!product.farm || product.farm.user_id !== farm.user_id) {
      throw new UnauthorizedException('Bạn không có quyền xoá sản phẩm này');
    }

    try {
      const deleteResult = await this.productsRepository.update({ product_id: product.product_id }, { status: ProductStatus.DELETED });

      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          `Không tìm thấy sản phẩm ID ${productId} để xóa trong transaction.`,
        );
      }

      return true;

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(`Không thể xoá sản phẩm: ${error.message}`);
    }
  }

  async updateProduct(productId: number, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    const userFarm = await this.farmRepository.findOne({ select: ["user_id"], where: { user_id: userId } });
    if (!userFarm) { throw new NotFoundException('Farm của người dùng không tồn tại'); }

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      relations: ["farm"]
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm ID ${productId} không tồn tại`);
    }

    if (!product.farm || product.farm.user_id !== userFarm.user_id) {
      throw new UnauthorizedException('Bạn không có quyền chỉnh sửa sản phẩm này');
    }

    try {
      const updateProduct = { ...product, ...updateProductDto };
      return await this.productsRepository.save(updateProduct);
    }
    catch (err) {
      throw new InternalServerErrorException("Không thể cập nhật sản phẩm");
    }
  }

  async getProductById(productId: number): Promise<Product> {
    const product = await this.productsRepository.findOne(
      {
        where: { product_id: productId },
        relations: ['farm', 'farm.address', 'subcategories'],
      },
    );
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }
    return product;
  }

  // async searchAndFillterProducts(
  //     page: number,
  //     limit: number,
  //     search?: string,
  //     category?: string,
  //     subcategory?: string,
  //     minPrice?: number,
  //     maxPrice?: number,
  //     farmId?: string,
  //     status?: ProductStatus,
  //     sortBy?: string,
  //     sortOrder?: 'asc' | 'desc',
  // ): Promise<{ items: ResponseProductDto[], totalItems: number, totalPages: number, currentPage: number }> {
  //     const queryBuilder = this.productsRepository.createQueryBuilder('product');
  //     queryBuilder
  //         .leftJoinAndSelect('product.farm', 'farm')
  //         .leftJoinAndSelect('farm.address', 'address')
  //         .leftJoinAndSelect('product.productSubcategoryDetails', 'productSubcategoryDetail')
  //         .leftJoinAndSelect('productSubcategoryDetail.subcategory', 'subcategory')
  //         .leftJoinAndSelect('subcategory.category', 'category');
  //     if (search) {
  //         queryBuilder.andWhere(
  //             '("product"."product_name" ILIKE :search OR "product"."description" ILIKE :search)',
  //             { search: `%${search}%` }
  //         );
  //     }
  //     if (category) {
  //         queryBuilder.andWhere('category.category_id = :categoryId', { categoryId: category });
  //     }
  //     if (subcategory) {
  //         queryBuilder.andWhere('subcategory.subcategory_id = :subcategoryId', { subcategoryId: subcategory });
  //     }
  //     console.log('minPrice:', minPrice);
  //     if (minPrice !== undefined) {
  //         queryBuilder.andWhere('product.price_per_unit >= :minPrice', { minPrice });
  //     }

  //     if (maxPrice !== undefined) {
  //         queryBuilder.andWhere('product.price_per_unit <= :maxPrice', { maxPrice });
  //     }
  //     // const sql = queryBuilder.getQuery();
  //     // console.log('SQL Query:', sql);

  //     if (farmId) {
  //         queryBuilder.andWhere('farm.farm_id = :farmId', { farmId });
  //     }
  //     if (status) {
  //         queryBuilder.andWhere('product.status = :status', { status });
  //     }

  //     if (sortBy) {
  //         const order = sortOrder?.toUpperCase() as 'ASC' | 'DESC' || 'ASC';

  //         switch (sortBy) {
  //             case 'price':
  //                 queryBuilder.orderBy('product.price_per_unit', order);
  //                 break;
  //             case 'name':
  //                 queryBuilder.orderBy('product.product_name', order);
  //                 break;
  //             case 'createdAt':
  //                 queryBuilder.orderBy('product.created', order);
  //                 break;
  //             default:
  //                 queryBuilder.orderBy('product.created', 'DESC'); // Default sort
  //         }
  //     } else {
  //         queryBuilder.orderBy('product.created', 'DESC');
  //     }

  //     const skip = (page - 1) * limit;

  //     const totalItems = await queryBuilder.getCount();
  //     const totalPages = Math.ceil(totalItems / limit);

  //     queryBuilder.skip(skip).take(limit);

  //     // Execute query
  //     const products = await queryBuilder.getMany();

  //     // Transform products to ResponseProductDto
  //     const items = await Promise.all(
  //         products.map(async (product) => {
  //             // Get subcategory details for the product
  //             const subcategoryDetails = await this.productSubcategoryDetailRepository.find({
  //                 where: { product: { product_id: product.product_id } },
  //                 relations: ['subcategory', 'subcategory.category'],
  //             });

  //             // Organize categories and subcategories
  //             const categoryMap = new Map<string, string[]>();
  //             for (const detail of subcategoryDetails) {
  //                 const categoryName = detail.subcategory.category.name;
  //                 const subcategoryName = detail.subcategory.name;

  //                 if (!categoryMap.has(categoryName)) {
  //                     categoryMap.set(categoryName, []);
  //                 }
  //                 categoryMap.get(categoryName)!.push(subcategoryName);
  //             }

  //             const categories = Array.from(categoryMap.entries()).map(
  //                 ([category, subcategories]) => ({
  //                     category,
  //                     subcategories,
  //                 }),
  //             );

  //             // Create response farm object
  //             const responseFarm: ResponseFarmDto = {
  //                 farm_id: product.farm.farm_id,
  //                 farm_name: product.farm.farm_name,
  //                 city: product.farm.address.city,
  //                 description: product.farm.description,
  //                 profile_image: product.farm.profile_image_urls,
  //                 avatar: product.farm.avatar_url,
  //                 certificate: product.farm.certificate_img_urls,
  //                 created: product.farm.created,
  //                 status: product.farm.status,
  //             };

  //             // Return formatted response product DTO
  //             return new ResponseProductDto({
  //                 ...product,
  //                 farm: responseFarm,
  //                 categories,
  //             });
  //         })
  //     );

  //     // Return paginated result with metadata
  //     return {
  //         items,
  //         totalItems,
  //         totalPages,
  //         currentPage: page
  //     };
  // }


  // // async getProductsByIds(ids: string[]): Promise<any[]> {
  // //     const productIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
  // //     if (productIds.length === 0) {
  // //         return [];
  // //     }

  // //     const productEntities = await this.productsRepository.find({
  // //         where: { product_id: In(productIds) },
  // //         relations: ['farm'],
  // //     });

  // //     if (productEntities.length === 0) {
  // //         return []; // Trả về mảng rỗng
  // //     }
  // //     const productEntityMap = new Map(productEntities.map(p => [p.product_id, p]));

  // //     const farmIdsFromProducts = productEntities
  // //         .map(p => p.farm?.farm_id)
  // //         .filter(id => id !== undefined && id !== null) as string[];
  // //     let farmsMap = new Map<string | number, Farm>();
  // //     if (farmIdsFromProducts.length > 0) {
  // //         const farmEntitiesFromService = await this.farmsService.findFarmsByIds(farmIdsFromProducts);
  // //         farmsMap = new Map(farmEntitiesFromService.map(f => [f.farm_id, f]));
  // //     }

  // //     const foundProductIds = productEntities.map(p => p.product_id);
  // //     // Giả sử categoriesService trả về ProductSubcategoryDetail[]
  // //     const allSubcategoryDetails: ProductSubcategoryDetail[] = await this.categoriesService.findProductSubcategoryDetailsByProductIds(foundProductIds);

  // //     const subcategoryDetailsByProductId = new Map<number, ProductSubcategoryDetail[]>();
  // //     for (const detail of allSubcategoryDetails) {
  // //         const detailProductId = detail.product?.product_id;
  // //         if (detailProductId === undefined) continue;
  // //         if (!subcategoryDetailsByProductId.has(detailProductId)) {
  // //             subcategoryDetailsByProductId.set(detailProductId, []);
  // //         }
  // //         subcategoryDetailsByProductId.get(detailProductId)!.push(detail);
  // //     }

  // //     // Khởi tạo mảng để chứa các ResponseProductDto
  // //     const results: Product[] = []; // Đặt tên là 'results' hoặc 'responseProductDtos'

  // //     for (const originalProductId of productIds) {
  // //         const productEntity = productEntityMap.get(originalProductId);
  // //         if (!productEntity) continue;

  // //         const farmEntity = productEntity.farm ? farmsMap.get(productEntity.farm.farm_id) : undefined;
  // //         const responseFarm: Farm | undefined = farmEntity ? farmEntity : undefined;

  // //         const productSpecificSubcategories = subcategoryDetailsByProductId.get(productEntity.product_id) || [];
  // //         const categories = this.categoriesService.mapProductSubcategoryDetailsToCategoryDtos(productSpecificSubcategories);

  // //         results.push(new Product());
  // //     }
  // //     this.logger.log(`(getProductsByIds) PRE-STRINGIFY: Found ${results.length} products.`);
  // //     try {
  // //         this.logger.log(`(getProductsByIds) STRINGIFYING: results content: ${JSON.stringify(results, null, 2)}`);
  // //     } catch (e) {
  // //         this.logger.error(`(getProductsByIds) ERROR DURING JSON.stringify: ${e.message}`);
  // //         // Log một phần nhỏ hơn, an toàn hơn để xem cấu trúc
  // //         if (results && results.length > 0) {
  // //             this.logger.log(`(getProductsByIds) First result keys: ${Object.keys(results[0]).join(', ')}`);
  // //         }
  // //     }
  // //     return results;
  // // }

  async findProductById(
    productId: number,
    options: {
      includeFarm?: boolean,
      includeCategory?: boolean,
      includeFarmAddress?: boolean,
    } = {},
  ): Promise<Product> {
    const {
      includeFarm = true,
      includeCategory = true,
      includeFarmAddress = true,
    } = options;

    const relationsToLoads: string[] = [];

    if (includeFarm) {
      relationsToLoads.push('farm');
      if (includeFarmAddress) {
        relationsToLoads.push('farm.address');
      }
    }

    if (includeCategory) {
      if (!relationsToLoads.includes('subcategories')) {
        relationsToLoads.push('subcategories');
      }
    }

    // this.logger.debug(`(findProductById) Đang tìm sản phẩm với ID: ${productId} và các quan hệ: ${relationsToLoads.join(', ')}`);

    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
      relations: relationsToLoads,
    });

    if (!product) {
      this.logger.error(`(findProductById) Không tìm thấy sản phẩm với ID: ${productId}`);
      throw new NotFoundException("Không tìm thấy sản phẩm");
    }
    return product;
  }


  // async getProductById(id: string): Promise<ResponseProductDto> {
  //     const productId = Number(id);
  //     if (isNaN(productId)) {
  //         throw new BadRequestException('ID sản phẩm không hợp lệ');
  //     }

  //     const product: Product | null = await this.findProductById(productId, {
  //         includeFarm: true,
  //         includeSubcategoryDetails: true,
  //         includeCategory: true,
  //         includeAddress: true,
  //         includeAddressGhn: false,
  //     });
  //     if (!product) {
  //         this.logger.warn(`(getProductById) Sản phẩm không tồn tại với ID: ${productId}`);
  //         throw new NotFoundException(`Sản phẩm với ID ${productId} không tồn tại`);
  //     }

  //     // BỎ LOG PRODUCT ENTITY Ở ĐÂY VÌ SẼ CÓ LOG SAU KHI MAP (NẾU CẦN)
  //     // this.logger.log(`(getProductById) Đã tìm thấy sản phẩm với ID: ${productId}`);
  //     // this.logger.log(`(getProductById) Product details: ${JSON.stringify(productEntity, null, 2)}`);

  //     this.logger.log(`(getProductById) Đã lấy được ProductEntity ID ${product.product_id}, bắt đầu map...`);

  //     // GỌI HÀM MAP
  //     const responseDto = this.toResponseDto(product);

  //     this.logger.log(`(getProductById) Map thành công ProductEntity ID ${product.product_id} sang ResponseProductDto.`);
  //     // Bạn có thể log DTO đã map để kiểm tra nếu cần (cẩn thận nếu DTO lớn)
  //     this.logger.debug(`(getProductById) DTO sau khi map: ${JSON.stringify(responseDto, null, 2)}`);

  //     return responseDto;

  // }

  // // Hàm tĩnh để chuyển đổi Product entity sang ResponseProductDto
  // private toResponseDto(product: Product): ResponseProductDto {


  //     // 1. Map Farm (bao gồm Address và AddressGhn nếu có)
  //     let farmDto: ResponseFarmDto | undefined = undefined;
  //     if (product.farm) {
  //         const farmEntity = product.farm as Farm;
  //         const partialFarmDto: Partial<ResponseFarmDto> = {
  //             farm_id: farmEntity.farm_id,
  //             farm_name: farmEntity.farm_name,
  //             city: farmEntity.address.city,
  //             description: farmEntity.description,

  //         };

  //         // if (farmEntity.address) {
  //         //     const addressEntity = farmEntity.address as Address;
  //         //     // Gán các trường từ addressEntity vào partialFarmDto
  //         //     // partialFarmDto.address_detail = addressEntity.address_detail;
  //         //     // partialFarmDto.ward_code = addressEntity.ward_code;
  //         //     // ...
  //         //     if (addressEntity.address_ghn) {
  //         //         const addressGhnEntity = addressEntity.address_ghn as AddressGhn;
  //         //         // Gán các trường từ addressGhnEntity vào partialFarmDto
  //         //         // partialFarmDto.ghn_province_id = addressGhnEntity.province_id;
  //         //         // ...
  //         //     }
  //         // }
  //         farmDto = new ResponseFarmDto(partialFarmDto);
  //     }

  //     // 2. Map Categories và Subcategories
  //     const categoriesData: { category: string; subcategories: string[] }[] = [];
  //     const categoriesMap = new Map<string, string[]>();

  //     if (product.productSubcategoryDetails && product.productSubcategoryDetails.length > 0) {
  //         for (const detail of product.productSubcategoryDetails as ProductSubcategoryDetail[]) {
  //             if (detail.subcategory && detail.subcategory.category) {
  //                 const categoryName = detail.subcategory.category.name;
  //                 const subcategoryName = detail.subcategory.name;
  //                 if (!categoriesMap.has(categoryName)) {
  //                     categoriesMap.set(categoryName, []);
  //                 }
  //                 categoriesMap.get(categoryName)!.push(subcategoryName);
  //             }
  //         }
  //         // Chuyển Map thành mảng theo cấu trúc DTO
  //         categoriesMap.forEach((subcategories, category) => {
  //             categoriesData.push({ category, subcategories });
  //         });
  //     }

  //     // 3. Tạo DTO chính
  //     const responseProductDto: ResponseProductDto = new ResponseProductDto({
  //         product_id: product.product_id,
  //         product_name: product.product_name,
  //         description: product.description,
  //         price_per_unit: typeof product.price_per_unit === 'string' ? parseFloat(product.price_per_unit) : product.price_per_unit,
  //         unit: product.unit,
  //         stock_quantity: product.stock_quantity,
  //         weight: product.weight,
  //         image_urls: product.image_urls || [],
  //         video_urls: product.video_urls || [],
  //         created: product.created,
  //         updated: product.updated,
  //         status: product.status,
  //         farm: farmDto,
  //         categories: categoriesData,
  //     });

  //     return responseProductDto;
  // }


  // async findProductsByIds(
  //     productIds: number[],
  //     options?: {
  //         includeFarm?: boolean;
  //         includeSubcategoryDetails?: boolean;
  //         includeCategory?: boolean;
  //         includeAddress?: boolean;
  //         includeAddressGhn?: boolean;
  //         includeIdentification?: boolean;
  //     }
  // ): Promise<Product[]> {
  //     if (!productIds || productIds.length === 0) {
  //         this.logger.warn(`(findProductsByIds) Danh sách ID sản phẩm rỗng.`);
  //         return [];
  //     }
  //     const relationsToLoads: string[] = [];
  //     if (options?.includeFarm) {
  //         relationsToLoads.push('farm');
  //     }
  //     if (options?.includeSubcategoryDetails) {
  //         relationsToLoads.push('productSubcategoryDetails');
  //     }
  //     if (options?.includeCategory) {
  //         if (!relationsToLoads.includes('productSubcategoryDetails')) { // Kiểm tra và thêm nếu chưa có
  //             relationsToLoads.push('productSubcategoryDetails');
  //         }
  //         if (!relationsToLoads.includes('productSubcategoryDetails.subcategory')) { // Kiểm tra và thêm nếu chưa có
  //             relationsToLoads.push('productSubcategoryDetails.subcategory');
  //         }
  //         relationsToLoads.push('productSubcategoryDetails.subcategory.category');
  //     }
  //     if (options?.includeIdentification) {
  //         if (!relationsToLoads.includes('farm')) {
  //             relationsToLoads.push('farm');
  //         }
  //         relationsToLoads.push('farm.identification');
  //     }
  //     // Tương tự cho address và address_ghn
  //     if (options?.includeAddress) {
  //         if (!relationsToLoads.includes('farm')) {
  //             relationsToLoads.push('farm');
  //         }
  //         relationsToLoads.push('farm.address');
  //     }
  //     if (options?.includeAddressGhn) {
  //         if (!relationsToLoads.includes('farm')) {
  //             relationsToLoads.push('farm');
  //         }
  //         if (!relationsToLoads.includes('farm.address')) {
  //             relationsToLoads.push('farm.address');
  //         }
  //         relationsToLoads.push('farm.address.address_ghn');
  //     }

  //     const uniqueRelationsToLoad = [...new Set(relationsToLoads)];
  //     this.logger.log(`(findProductsByIds) Đang tìm sản phẩm với các ID: ${JSON.stringify(productIds)} và relations: ${JSON.stringify(uniqueRelationsToLoad)}`);
  //     const products = await this.productsRepository.find({
  //         where: { product_id: In(productIds) },
  //         relations: uniqueRelationsToLoad,
  //     });
  //     if (products.length === 0) {
  //         this.logger.warn(`(findProductsByIds) Không tìm thấy sản phẩm nào cho các ID: ${JSON.stringify(productIds)}`);
  //     } else {
  //         this.logger.log(`(findProductsByIds) Đã tìm thấy ${products.length} sản phẩm.`);
  //         this.logger.log(`(findProductsByIds) Product details: ${JSON.stringify(products, null, 2)}`);
  //     }
  //     return products;
  // }

  // async findProductsByFarmId(farmId: string): Promise<Product[]> {
  //     if (!farmId) {
  //         this.logger.warn(`(findProductsByFarmId) farmId không được cung cấp.`);
  //         return [];
  //     }
  //     this.logger.log(`(findProductsByFarmId) Đang tìm sản phẩm cho farm ID: ${farmId}`);
  //     const products = await this.productsRepository.find({
  //         where: { farm: { farm_id: farmId } },
  //         relations: ['farm', 'productSubcategoryDetails', 'productSubcategoryDetails.subcategory', 'productSubcategoryDetails.subcategory.category'],
  //     });
  //     if (products.length === 0) {
  //         this.logger.warn(`(findProductsByFarmId) Không tìm thấy sản phẩm nào cho farm ID: ${farmId}`);
  //     } else {
  //         this.logger.log(`(findProductsByFarmId) Đã tìm thấy ${products.length} sản phẩm cho farm ID: ${farmId}`);
  //         this.logger.log(`(findProductsByFarmId) Product details: ${JSON.stringify(products, null, 2)}`);
  //     }
  //     return products;
  // }




}//