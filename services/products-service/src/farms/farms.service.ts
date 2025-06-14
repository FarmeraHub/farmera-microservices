import { GhnService } from './../ghn/ghn.service';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { Address } from './entities/address.entity';
import { FarmStatus } from '../common/enums/farm-status.enum';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { BiometricsService } from 'src/biometrics/biometrics.service';
import { Identification, IdentificationMethod, IdentificationStatus } from './entities/identification.entity';
import * as fs from 'fs/promises';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { FileStorageService } from 'src/file-storage/file-storage.service';
import { FptIdrCccdFrontData, FptIdrCardFrontData } from 'src/biometrics/interfaces/fpt-idr-front.interface';
import { SavedFileResult } from 'src/file-storage/storage.strategy.interface';
import { ResponseFarmDto } from './dto/response-farm.dto';
import { AddressGHN } from './entities/address-ghn.entity';
import { validate as isUUID } from 'uuid';
@Injectable()
export class FarmsService {
  private readonly logger = new Logger(FarmsService.name);
  constructor(
    @InjectRepository(Farm)
    private farmsRepository: Repository<Farm>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Identification)
    private identification: Repository<Identification>,
    @InjectRepository(AddressGHN)
    private addressGHNRepository: Repository<AddressGHN>,
    private readonly biometricsService: BiometricsService,
    private dataSource: DataSource,
    private readonly fileStorageService: FileStorageService,
    private readonly GhnService: GhnService,

  ) { }



  async farmRegister(
    registerDto: FarmRegistrationDto,
    userId: string,
    files: {
      cccd?: Express.Multer.File[];
      biometric_video?: Express.Multer.File[];
    },
  ): Promise<Farm> {

    const cccdFile = files?.cccd?.[0];
    const videoFile = files?.biometric_video?.[0];


    if (!cccdFile) {
      throw new BadRequestException('Ảnh CCCD (trường: cccd) là bắt buộc.');
    }
    if (!videoFile) {
      throw new BadRequestException('Video xác thực khuôn mặt (trường: biometric_video) là bắt buộc.');
    }

    if (!cccdFile.originalname || (!cccdFile.path && !cccdFile.buffer)) {
      throw new BadRequestException(`File ảnh CCCD '${cccdFile.originalname || 'không tên'}' không hợp lệ.`);
    }
    if (!videoFile.originalname || (!videoFile.path && !videoFile.buffer)) {
      throw new BadRequestException(`File video '${videoFile.originalname || 'không tên'}' không hợp lệ.`);
    }
    const cccdTempPath = cccdFile?.path;
    const videoTempPath = videoFile?.path;


    let idrData: FptIdrCardFrontData;
    let savedCccdFileResult: SavedFileResult | null = null;
    const existingFarm = await this.farmsRepository.findOne({ where: { user_id: userId } });
    if (existingFarm) {
      if (videoFile.path || cccdFile.path) {
        fs.unlink(cccdTempPath).catch(err => this.logger.error(`[Register] Lỗi xóa file CCCD tạm ${cccdTempPath}: ${err.message}`));
        fs.unlink(videoFile.path).catch(err => this.logger.error(`[Register] Lỗi xóa video tạm ${videoFile.path}: ${err.message}`));
      }

      throw new BadRequestException('Người dùng đã tạo một trang trại trước đó.');
    }


    try {

      this.logger.log(`[Register] Bước 1: Gọi FPT IDR cho user ${userId}, file ${cccdFile.originalname}`);
      const idrCardDataArray = await this.biometricsService.callFptIdrApiForFront(cccdFile);

      idrData = idrCardDataArray[0];
      this.logger.log(`[Register] FPT IDR thành công cho user ${userId}. Loại thẻ: ${idrData.type}, Loại mới: ${idrData.type_new}`);

      this.logger.log(`[Register] Bước 2: Gọi FPT Liveness cho user ${userId}, ảnh ${cccdFile.originalname}, video ${videoFile.originalname}`);
      const livenessResult = await this.biometricsService.callFptLivenessApi(cccdFile, videoFile);
      this.logger.log(`[Register] FPT Liveness thành công cho user ${userId}. Liveness: ${livenessResult.liveness?.is_live}, Match: ${livenessResult.face_match?.isMatch}`);
      if (videoFile.path) {
        this.logger.log(`[Register] Xóa file video tạm ${videoFile.path} sau khi Liveness thành công.`);
        fs.unlink(videoFile.path).catch(err => this.logger.error(`[Register] Lỗi xóa video tạm ${videoFile.path}: ${err.message}`));
      }
      this.logger.log(`[Register] Bước 3: Lưu ảnh CCCD cho user ${userId} vào bộ nhớ vĩnh viễn.`);
      const savedFiles = await this.fileStorageService.saveFiles([cccdFile], 'cccd');

      if (!savedFiles || savedFiles.length === 0 || !savedFiles[0].url) {
        this.logger.error(`[Register] FileStorageService không thể lưu ảnh CCCD cho user ${userId}.`);
        throw new InternalServerErrorException('Không thể lưu trữ ảnh CCCD.');
      }
      savedCccdFileResult = savedFiles[0];
      this.logger.log(`[Register] Ảnh CCCD đã được lưu. URL: ${savedCccdFileResult.url}, Định danh: ${savedCccdFileResult.identifier}`);

      this.logger.log(`[Register] Bước 4: Lưu thông tin đăng ký vào database cho user ${userId}.`);

      const ghn_province_id = await this.GhnService.getIdProvince(registerDto.city);
      if (!ghn_province_id) {
        this.logger.error(`[Register] Không tìm thấy ID tỉnh GHN cho thành phố ${registerDto.city}`);
        throw new BadRequestException(`Không tìm thấy ID tỉnh GHN cho thành phố ${registerDto.city}`);
      }
      const ghn_district_id = await this.GhnService.getIdDistrict(registerDto.district, ghn_province_id);
      if (!ghn_district_id) {
        this.logger.error(`[Register] Không tìm thấy ID quận huyện GHN cho ${registerDto.district} trong tỉnh ${registerDto.city}`);
        throw new BadRequestException(`Không tìm thấy ID quận huyện GHN cho ${registerDto.district} trong tỉnh ${registerDto.city}`);
      }
      const ghn_ward_id = await this.GhnService.getIdWard(registerDto.ward, ghn_district_id);
      if (!ghn_ward_id) {
        this.logger.error(`[Register] Không tìm thấy ID phường xã GHN cho ${registerDto.ward} trong quận ${registerDto.district}`);
        throw new BadRequestException(`Không tìm thấy ID phường xã GHN cho ${registerDto.ward} trong quận ${registerDto.district}`);
      }
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {

        const ghnAddress = new AddressGHN();
        ghnAddress.province_id = ghn_province_id;
        ghnAddress.district_id = ghn_district_id;
        ghnAddress.ward_code = ghn_ward_id;
        const savedGhnAddress = await queryRunner.manager.save(ghnAddress);


        const farm = new Farm();
        farm.farm_name = registerDto.farm_name;
        farm.description = registerDto.description || '';
        farm.email = registerDto.email;
        farm.phone = registerDto.phone;
        farm.tax_number = registerDto.tax_number || '';
        farm.user_id = userId;
        farm.status = FarmStatus.APPROVED;

        const address = new Address();
        address.city = registerDto.city;
        address.district = registerDto.district;
        address.ward = registerDto.ward;
        address.street = registerDto.street;
        address.coordinate = registerDto.coordinate;
        farm.address = address;
        address.address_ghn = savedGhnAddress;

        const identification = new Identification();
        identification.status = IdentificationStatus.APPROVED;
        identification.method = IdentificationMethod.BIOMETRIC;

        identification.id_number = idrData.id || 'N/A';
        identification.full_name = idrData.name || 'N/A';

        if ('nationality' in idrData) {
          identification.nationality = (idrData as FptIdrCccdFrontData).nationality || 'N/A';
        } else {
          identification.nationality = 'N/A';
        }

        identification.id_card_imageUrl = savedCccdFileResult.url;
        farm.identification = identification;

        const savedFarm = await queryRunner.manager.save(farm);
        await queryRunner.commitTransaction();
        this.logger.log(`[Register] Đăng ký farm thành công cho user ${userId}, Farm ID: ${savedFarm.farm_id}`);


        return savedFarm;

      } catch (dbError: any) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`[Register] Lỗi database transaction cho user ${userId}: ${dbError.message}`, dbError.stack);
        if (savedCccdFileResult) {
          this.logger.warn(`[Register] Thử xóa file CCCD đã lưu (${savedCccdFileResult.identifier}) do lỗi DB cho user ${userId}`);
          await this.fileStorageService.cleanupFiles([savedCccdFileResult]);
        }
        throw new InternalServerErrorException('Không thể lưu dữ liệu đăng ký vào database.');
      } finally {
        await queryRunner.release();
      }
    } catch (error: any) {
      this.logger.error(`[Register] Quy trình đăng ký thất bại cho user ${userId}: ${error.message}`, error.stack);
      const isDbRelatedError = error instanceof InternalServerErrorException && (
        error.message === 'Không thể lưu dữ liệu đăng ký vào database.' ||
        error.message.startsWith('Lỗi lưu dữ liệu: Một định danh (ID) không hợp lệ')
      );
      if (savedCccdFileResult && !isDbRelatedError) {
        this.logger.warn(`[Register] Lỗi chung, thử xóa file CCCD đã lưu vĩnh viễn (${savedCccdFileResult.identifier}) cho user ${userId}`);
        await this.fileStorageService.cleanupFiles([savedCccdFileResult]);
      }
      if (!savedCccdFileResult && cccdTempPath) {
        this.logger.warn(`[Register] Lỗi xảy ra trước khi lưu CCCD, thử xóa file CCCD tạm: ${cccdTempPath}`);
        fs.unlink(cccdTempPath)
          .then(() => this.logger.log(`[Register] Đã xóa file CCCD tạm: ${cccdTempPath}`))
          .catch(unlinkError => {
            if ((unlinkError as NodeJS.ErrnoException).code !== 'ENOENT') {
              this.logger.error(`[Register] Lỗi xóa file CCCD tạm ${cccdTempPath}: ${unlinkError.message}`);
            } else {
              this.logger.warn(`[Register] File CCCD tạm ${cccdTempPath} không tìm thấy để xóa (có thể đã được dọn hoặc chưa tạo).`);
            }
          });
      }

      if (videoTempPath) {
        this.logger.warn(`[Register] Lỗi xảy ra, thử xóa file video tạm: ${videoTempPath}`);
        fs.unlink(videoTempPath)
          .then(() => this.logger.log(`[Register] Đã xóa file video tạm: ${videoTempPath}`))
          .catch(unlinkError => {
            if ((unlinkError as NodeJS.ErrnoException).code !== 'ENOENT') {
              this.logger.error(`[Register] Lỗi xóa file video tạm ${videoTempPath}: ${unlinkError.message}`);
            } else {
              this.logger.warn(`[Register] File video tạm ${videoTempPath} không tìm thấy để xóa.`);
            }
          });
      }

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || 'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký farm.');
    }
  }

  async findOne(id: string): Promise<Farm> {
    const farm = await this.farmsRepository.findOne({
      where: { farm_id: id },
      relations: ['address'],
    });

    if (!farm) {
      throw new NotFoundException(`Không tìm thấy trang trại với ID ${id}`);
    }

    return farm;
  }

  // Tìm kiếm trang trại theo user_id trả về true nếu có trang trại, false nếu không có
  async findByUserId(userId: string): Promise<Boolean> {
    const farm = await this.farmsRepository.findOne({
      where: { user_id: userId },
      relations: ['address'],
    });
    if (!farm) {
      return false;
    }
    return true;
  }

  // //Tìm kiếm trang trại theo user_id, và trang trại đó đang được hoạt động. trả về true nếu có trang trại, false nếu không có
  // async findActiveFarmByUserId(userId: string): Promise<Boolean> {
  //   const farm = await this.farmsRepository.findOne({
  //     where: { user_id: userId, status: FarmStatus.APPROVED },
  //   });
  //   if (!farm) {
  //     return false;
  //   }
  //   return true;
  // }


  async findByUserID(userId: string): Promise<Farm> {
    const farm = await this.farmsRepository.findOne({
      where: { user_id: userId },
      relations: ['address', 'address.address_ghn', 'identification'],
    });

    if (!farm) {
      throw new NotFoundException(`Không tìm thấy trang trại của người dùng với ID ${userId}`);
    }
    if (userId !== farm.user_id) {
      throw new BadRequestException('Người dùng không có quyền truy cập trang trại này');
    }

    return farm;
  }

  async findFarmById(farmId: string): Promise<Farm> {
    if (!isUUID(farmId)) {
      this.logger.warn(`Invalid Farm ID format: ${farmId}`);
      throw new BadRequestException(`ID trang trại không hợp lệ.`);
    }
    const farm = await this.farmsRepository.findOne({
      where: { farm_id: farmId },
      relations: ['address', 'address.address_ghn', 'identification'],
    });

    if (!farm) {
      throw new NotFoundException(`Không tìm thấy trang trại với ID ${farmId}`);
    }
    this.logger.log(`Farm found: ${JSON.stringify(farm, null, 2)}`);
    return farm;
  }
  async findFarmsByIds(farmIds: string[]): Promise<Farm[]> { // Hoặc number[]
    if (!farmIds || farmIds.length === 0) {
      return [];
    }

    const result = await this.farmsRepository.find({
      where: { farm_id: In(farmIds) },
      relations: ['address', 'address.address_ghn'],
    });
    this.logger.log(`result: ${JSON.stringify(result, null, 2)}`);
    return result;
  }
  async updateFarm(
    farmId: string,
    updateFarmDto: UpdateFarmDto,
    user_id: string,
    files: {
      avatarFile?: Express.Multer.File;
      profileFiles: Express.Multer.File[];
      certificateFiles: Express.Multer.File[];
    },
  ): Promise<Farm | { message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let isUpdated = false;
    const newlySavedFiles: SavedFileResult[] = [];
    let oldAvatarUrlToDelete: string | null = null;
    const oldProfileImageUrlsToDelete: string[] = [];
    const oldCertificateImageUrlsToDelete: string[] = [];

    try {
      const farm = await this.farmsRepository.findOne({
        where: { farm_id: farmId },
        relations: ['address'], // Ensure address is loaded
      });

      if (!farm) {
        throw new NotFoundException('Không tìm thấy trang trại');
      }

      if (farm.user_id !== user_id) {
        throw new BadRequestException('Người dùng không có quyền cập nhật trang trại này');
      }

      const fieldsToCheck = ['farm_name', 'description', 'email', 'phone', 'tax_number'];
      for (const field of fieldsToCheck) {
        if (updateFarmDto[field] !== undefined && updateFarmDto[field] !== farm[field]) {
          farm[field] = updateFarmDto[field];
          isUpdated = true;
        }
      }

      if (files.avatarFile) {
        if (farm.avatar_url) {
          oldAvatarUrlToDelete = farm.avatar_url;
        }
        const [savedAvatar] = await this.fileStorageService.saveFiles(
          [files.avatarFile],
          'farm_avatar',
        );
        if (savedAvatar) {
          newlySavedFiles.push(savedAvatar);
          farm.avatar_url = savedAvatar.url;
        }
        isUpdated = true;
      }

      const currentProfileImageUrls = farm.profile_image_urls || [];
      const incomingProfileImageUrls = updateFarmDto.profile_image || []; // URLs client wants to keep
      const finalProfileImageUrls: string[] = [];

      for (const existingUrl of currentProfileImageUrls) {
        if (!incomingProfileImageUrls.includes(existingUrl)) {
          oldProfileImageUrlsToDelete.push(existingUrl);
        }
      }
      finalProfileImageUrls.push(...incomingProfileImageUrls.filter(url => currentProfileImageUrls.includes(url) || updateFarmDto.profile_image.includes(url)));


      if (files.profileFiles && files.profileFiles.length > 0) {
        const savedNewProfileImages = await this.fileStorageService.saveFiles(
          files.profileFiles,
          'farm_profile',
        );
        newlySavedFiles.push(...savedNewProfileImages);
        finalProfileImageUrls.push(...savedNewProfileImages.map(f => f.url));
      }

      const newUniqueProfileUrls = [...new Set(finalProfileImageUrls)];
      if (JSON.stringify(newUniqueProfileUrls.sort()) !== JSON.stringify(currentProfileImageUrls.sort())) {
        farm.profile_image_urls = newUniqueProfileUrls;
        isUpdated = true;
      }


      const currentCertificateImageUrls = farm.certificate_img_urls || [];
      const incomingCertificateImageUrls = updateFarmDto.certificate_image || [];
      const finalCertificateImageUrls: string[] = [];

      for (const existingUrl of currentCertificateImageUrls) {
        if (!incomingCertificateImageUrls.includes(existingUrl)) {
          oldCertificateImageUrlsToDelete.push(existingUrl);
        }
      }
      finalCertificateImageUrls.push(...incomingCertificateImageUrls.filter(url => currentCertificateImageUrls.includes(url) || updateFarmDto.certificate_image.includes(url)));

      if (files.certificateFiles && files.certificateFiles.length > 0) {
        const savedNewCertificateImages = await this.fileStorageService.saveFiles(
          files.certificateFiles,
          'farm_certificate',
        );
        newlySavedFiles.push(...savedNewCertificateImages);
        finalCertificateImageUrls.push(...savedNewCertificateImages.map(f => f.url));
      }

      const newUniqueCertificateUrls = [...new Set(finalCertificateImageUrls)];
      if (JSON.stringify(newUniqueCertificateUrls.sort()) !== JSON.stringify(currentCertificateImageUrls.sort())) {
        farm.certificate_img_urls = newUniqueCertificateUrls;
        isUpdated = true;
      }

      if (!farm.address) {
        farm.address = new Address();
      }

      let addressUpdated = false;
      const addressFieldsToCheck = ['city', 'district', 'ward', 'street', 'coordinate'];
      for (const field of addressFieldsToCheck) {
        if (updateFarmDto[field] !== undefined && updateFarmDto[field] !== farm.address[field]) {
          farm.address[field] = updateFarmDto[field];
          addressUpdated = true;
          isUpdated = true;
        }
      }

      if (!isUpdated && !addressUpdated) {
        return { message: 'Không có dữ liệu nào được cập nhật' };
      }

      farm.updated = new Date();
      await queryRunner.manager.save(Farm, farm);
      if (addressUpdated) {
        await queryRunner.manager.save(Address, farm.address);
      }

      await queryRunner.commitTransaction();

      //  After successful commit, delete old files from storage
      if (oldAvatarUrlToDelete) {
        this.fileStorageService.deleteFilesByUrl([oldAvatarUrlToDelete]).catch(err => {
          console.error('Failed to delete old avatar:', err);
        });
      }
      if (oldProfileImageUrlsToDelete.length > 0) {
        this.fileStorageService.deleteFilesByUrl(oldProfileImageUrlsToDelete).catch(err => {
          console.error('Failed to delete old profile images:', err);
        });
      }
      if (oldCertificateImageUrlsToDelete.length > 0) {
        this.fileStorageService.deleteFilesByUrl(oldCertificateImageUrlsToDelete).catch(err => {
          console.error('Failed to delete old certificate images:', err);
        });
      }

      const newFarm = await this.farmsRepository.findOne({
        where: { farm_id: farmId },
        relations: ['address'],
      });
      if (!newFarm) {
        throw new NotFoundException(`Không tìm thấy trang trại với ID ${farmId}`);
      }
      return newFarm;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (newlySavedFiles.length > 0) {
        await this.fileStorageService.cleanupFiles(newlySavedFiles);
      }
      throw new BadRequestException(`Không thể cập nhật trang trại: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}