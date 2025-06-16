import { GhnService } from './../ghn/ghn.service';
import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { Address } from './entities/address.entity';
import { FarmStatus } from '../common/enums/farm-status.enum';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { BiometricsService } from 'src/biometrics/biometrics.service';
import { Identification, IdentificationMethod, IdentificationStatus } from './entities/identification.entity';
import { FarmRegistrationDto } from './dto/farm-registration.dto';
import { FptIdrCccdFrontData, FptIdrCardFrontData } from 'src/biometrics/interfaces/fpt-idr-front.interface';
import { AddressGHN } from './entities/address-ghn.entity';
import { validate as isUUID } from 'uuid';
import { AzureBlobService } from 'src/services/azure-blob.service';

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
        private readonly fileStorageService: AzureBlobService,
        private readonly GhnService: GhnService,
    ) { }

    async farmRegister(registerDto: FarmRegistrationDto, userId: string): Promise<Farm> {

        const existingFarm = await this.farmsRepository.findOne({ where: { user_id: userId } });
        if (existingFarm) {
            throw new BadRequestException('Người dùng đã tạo một trang trại trước đó.');
        }

        try {
            // validate address
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
                farm.status = FarmStatus.PENDING;

                const address = new Address();
                address.city = registerDto.city;
                address.district = registerDto.district;
                address.ward = registerDto.ward;
                address.street = registerDto.street;
                address.coordinate = registerDto.coordinate;
                farm.address = address;
                address.address_ghn = savedGhnAddress;

                const savedFarm = await queryRunner.manager.save(farm);
                await queryRunner.commitTransaction();
                this.logger.log(`[Register] Đăng ký farm thành công cho user ${userId}, Farm ID: ${savedFarm.farm_id}`);

                // // delete biometric video
                // await this.fileStorageService.deleteFile(registerDto.biometric_video_url);

                return savedFarm;

            } catch (dbError: any) {
                await queryRunner.rollbackTransaction();
                throw new InternalServerErrorException('Không thể lưu dữ liệu đăng ký vào database.');
            } finally {
                await queryRunner.release();
            }
        } catch (error: any) {
            this.logger.error(`[Register] Quy trình đăng ký thất bại cho user ${userId}: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(error.message || 'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký farm.');
        }
    }

    async verifyBiometric(ssnImg: Express.Multer.File, faceVideo: Express.Multer.File, farmId: string, user: string): Promise<Farm> {

        let idrData: FptIdrCardFrontData;

        const farm = await this.farmsRepository.findOne({ where: { farm_id: farmId } });
        if (!farm) {
            throw new NotFoundException("Không tìm thấy farm");
        }
        const userId = farm.user_id;
        if (user !== userId) {
            throw new UnauthorizedException();
        }

        try {
            // validate ssn
            this.logger.log(`[Register] Bước 1: Gọi FPT IDR cho user ${userId}, file ${ssnImg.originalname}`);
            const idrCardDataArray = await this.biometricsService.callFptIdrApiForFront(ssnImg);

            idrData = idrCardDataArray[0];
            this.logger.log(`[Register] FPT IDR thành công cho user ${userId}. Loại thẻ: ${idrData.type}, Loại mới: ${idrData.type_new}`);

            this.logger.log(`[Register] Bước 2: Gọi FPT Liveness cho user ${userId}, ảnh ${ssnImg.originalname}, video ${faceVideo.originalname}`);
            const livenessResult = await this.biometricsService.callFptLivenessApi(ssnImg, faceVideo);
            this.logger.log(`[Register] FPT Liveness thành công cho user ${userId}. Liveness: ${livenessResult.liveness?.is_live}, Match: ${livenessResult.face_match?.isMatch}`);

            this.logger.log(`[Register] Bước 3: Lưu thông tin đăng ký vào database cho user ${userId}.`);

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

            const ssn_img_url = await this.fileStorageService.uploadFile(ssnImg, userId);

            identification.id_card_imageUrl = ssn_img_url;
            farm.identification = identification;
            farm.status = FarmStatus.VERIFIED;

            return await this.farmsRepository.save(farm);
        }
        catch (error) {
            this.logger.error(`[Register] Quy trình đăng ký thất bại cho user ${userId}: ${error.message}`, error.stack);
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
            where: { user_id: userId, status: FarmStatus.VERIFIED || FarmStatus.APPROVED },
            relations: ['address'],
        });
        if (!farm) {
            return false;
        }
        return true;
    }

    async findByUserID(userId: string): Promise<Farm> {
        const farm = await this.farmsRepository.findOne({
            where: { user_id: userId, status: FarmStatus.VERIFIED || FarmStatus.APPROVED },
            relations: ['address', 'address.address_ghn'],
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
            this.logger.error(`Invalid UUID format: ${farmId}`);
            throw new BadRequestException(`ID trang trại không hợp lệ.`);
        }
        const farm = await this.farmsRepository.findOne({
            where: { farm_id: farmId },
            relations: ['address', 'address.address_ghn'],
        });

        if (!farm) {
            throw new NotFoundException(`Không tìm thấy trang trại với ID ${farmId}`);
        }
        // this.logger.log(`Farm found: ${JSON.stringify(farm, null, 2)}`);
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
    ): Promise<Farm> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let oldAvatarUrlToDelete: string | null = null;
        const oldProfileImageUrlsToDelete: string[] = [];
        const oldCertificateImageUrlsToDelete: string[] = [];

        try {
            const farm = await this.farmsRepository.findOne({
                where: { farm_id: farmId },
                relations: ['address'],
            });

            if (!farm) {
                throw new NotFoundException('Không tìm thấy trang trại');
            }

            if (farm.user_id !== user_id) {
                throw new BadRequestException('Người dùng không có quyền cập nhật trang trại này');
            }

            // update fields
            const fieldsToCheck = ['farm_name', 'description', 'email', 'phone', 'tax_number'];
            for (const field of fieldsToCheck) {
                if (updateFarmDto[field] !== undefined && updateFarmDto[field] !== farm[field]) {
                    farm[field] = updateFarmDto[field];
                }
            }

            // update avatar
            if (updateFarmDto.avatar_url) {
                if (farm.avatar_url) {
                    oldAvatarUrlToDelete = farm.avatar_url;
                }
                farm.avatar_url = updateFarmDto.avatar_url;
            }

            // update profile images
            const currentProfileImageUrls = farm.profile_image_urls || [];
            const incomingProfileImageUrls = updateFarmDto.profile_image_urls || []; // URLs client wants to keep

            for (const existingUrl of currentProfileImageUrls) {
                if (!incomingProfileImageUrls.includes(existingUrl)) {
                    oldProfileImageUrlsToDelete.push(existingUrl);
                }
            }

            farm.profile_image_urls = incomingProfileImageUrls;

            // update certification images
            const currentCertificateImageUrls = farm.certificate_img_urls || [];
            const incomingCertificateImageUrls = updateFarmDto.certificate_image_urls || [];

            for (const existingUrl of currentCertificateImageUrls) {
                if (!incomingCertificateImageUrls.includes(existingUrl)) {
                    oldCertificateImageUrlsToDelete.push(existingUrl);
                }
            }
            farm.certificate_img_urls = incomingCertificateImageUrls;


            if (!farm.address) {
                farm.address = new Address();
            }

            let addressUpdated = false;
            const addressFieldsToCheck = ['city', 'district', 'ward', 'street', 'coordinate'];
            for (const field of addressFieldsToCheck) {
                if (updateFarmDto[field] !== undefined && updateFarmDto[field] !== farm.address[field]) {
                    farm.address[field] = updateFarmDto[field];
                }
            }

            if (addressUpdated) {
                await queryRunner.manager.save(Address, farm.address);
            }

            farm.updated = new Date();
            await queryRunner.manager.save(Farm, farm);

            await queryRunner.commitTransaction();

            //  After successful commit, delete old files from storage
            if (oldAvatarUrlToDelete) {
                this.fileStorageService.deleteFile(oldAvatarUrlToDelete).catch(err => {
                    this.logger.error('Failed to delete old avatar:', err);
                });
            }
            if (oldProfileImageUrlsToDelete.length > 0) {
                oldProfileImageUrlsToDelete.forEach((value) => {
                    this.fileStorageService.deleteFile(value).catch(err => {
                        this.logger.error('Failed to delete old profile images:', err);
                    })
                })
            }
            if (oldCertificateImageUrlsToDelete.length > 0) {
                oldCertificateImageUrlsToDelete.forEach((value) => {
                    this.fileStorageService.deleteFile(value).catch(err => {
                        this.logger.error('Failed to delete old certificate images:', err);
                    })
                })
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
            throw new InternalServerErrorException(`Không thể cập nhật trang trại: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }
}