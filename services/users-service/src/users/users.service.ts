import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { CreateUserDto, CreateUserSignUpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { PaymentMethod } from './entities/payment_method.entity';
import * as bcrypt from 'bcrypt';
import { VerificationService } from 'src/verification/verification.service';
import { UserRole } from 'src/enums/roles.enum';
import { HashService } from 'src/services/hash.service';
import { UserStatus } from 'src/enums/status.enum';
import { PaymentProvider } from 'src/enums/payment_method.enum';
import { Gender } from 'src/enums/gender.enum';
import { JwtDecoded } from 'src/guards/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,

    private verificationService: VerificationService,

    private hashService: HashService,
  ) {}

  async createUserSignUp(createUserSignUpDto: CreateUserSignUpDto) {
    console.log(createUserSignUpDto);

    await this.verificationService.verifyCode({
      email: createUserSignUpDto.email,
      code: createUserSignUpDto.code,
    });

    await this.verificationService.deleteVerification(
      createUserSignUpDto.email,
    );

    const { email } = createUserSignUpDto;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('This email is already in use');
    }

    const newUser = this.usersRepository.create({
      email: createUserSignUpDto.email,
      first_name: createUserSignUpDto.firstName,
      last_name: createUserSignUpDto.lastName,
      hashed_pwd: await this.hashService.hashPassword(
        createUserSignUpDto.password,
      ),
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedUser = await this.usersRepository.save(newUser);

    const { hashed_pwd, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['locations', 'payment_methods'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async getUserDetailsById(id: string, user: JwtDecoded) {
    const foundUser = await this.usersRepository.findOne({
      where: { id },
      relations: ['locations', 'payment_methods'],
    });

    if (!foundUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new ConflictException("You don't have permission to do this");
    }

    return foundUser;
  }

  // Additional User Management Methods
  async updateUser(id: string, updateData: Partial<UpdateUserDto>) {
    const user = await this.getUserById(id);

    const updateFields: any = { updated_at: new Date() };

    if (updateData.first_name) updateFields.first_name = updateData.first_name;
    if (updateData.last_name) updateFields.last_name = updateData.last_name;
    if (updateData.gender) updateFields.gender = updateData.gender;
    if (updateData.avatar) updateFields.avatar = updateData.avatar;
    if (updateData.birthday) updateFields.birthday = updateData.birthday;
    if (updateData.farm_id) updateFields.farm_id = updateData.farm_id;
    if (updateData.points !== undefined)
      updateFields.points = updateData.points;

    await this.usersRepository.update(id, updateFields);

    return this.getUserById(id);
  }

  async updateUserProfile(id: string, profileData: any) {
    const user = await this.getUserById(id);

    const updateFields: any = {
      updated_at: new Date(),
      ...profileData,
    };

    await this.usersRepository.update(id, updateFields);

    return this.getUserById(id);
  }

  async deleteUser(id: string, hardDelete = false) {
    const user = await this.getUserById(id);

    if (hardDelete) {
      await this.usersRepository.delete(id);
      return { success: true, message: 'User permanently deleted' };
    } else {
      await this.usersRepository.update(id, {
        status: UserStatus.INACTIVE,
        updated_at: new Date(),
      });
      return { success: true, message: 'User deactivated successfully' };
    }
  }

  async listUsers(
    filters: {
      page?: number;
      limit?: number;
      role_filter?: UserRole;
      status_filter?: UserStatus;
      search_query?: string;
      created_date_range?: { start_time?: Date; end_time?: Date };
    } = {},
  ) {
    const {
      page = 1,
      limit = 10,
      role_filter,
      status_filter,
      search_query,
      created_date_range,
    } = filters;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (role_filter) {
      queryBuilder.andWhere('user.role = :role', { role: role_filter });
    }

    if (status_filter) {
      queryBuilder.andWhere('user.status = :status', { status: status_filter });
    }

    if (search_query) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search_query}%` },
      );
    }

    if (created_date_range?.start_time && created_date_range?.end_time) {
      queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
        start: created_date_range.start_time,
        end: created_date_range.end_time,
      });
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);
    queryBuilder.orderBy('user.created_at', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      pagination: {
        total_items: total,
        total_pages: Math.ceil(total / limit),
        current_page: page,
        page_size: limit,
        has_next_page: page * limit < total,
        has_previous_page: page > 1,
      },
    };
  }

  async getUsersByRole(
    role: UserRole,
    pagination?: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 10 } = pagination || {};

    return this.listUsers({
      page,
      limit,
      role_filter: role,
    });
  }

  async updateUserStatus(
    id: string,
    status: UserStatus,
    reason?: string,
    adminId?: string,
  ) {
    const user = await this.getUserById(id);

    await this.usersRepository.update(id, {
      status,
      updated_at: new Date(),
    });

    console.log(
      `User ${id} status changed to ${status} by admin ${adminId}. Reason: ${reason}`,
    );

    return this.getUserById(id);
  }

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  // Location Management
  async addUserLocation(
    userId: string,
    locationData: {
      name?: string;
      phone?: string;
      address_line: string;
      city: string;
      state: string;
      postal_code?: string;
      country: string;
      latitude?: number;
      longitude?: number;
      is_default?: boolean;
    },
  ) {
    const user = await this.getUserById(userId);

    if (locationData.is_default) {
      await this.locationsRepository.update(
        { user_id: parseInt(userId) },
        { is_primary: false },
      );
    }

    const newLocation = this.locationsRepository.create({
      user_id: parseInt(userId),
      name: locationData.name,
      phone: locationData.phone,
      city: locationData.city,
      district: locationData.state,
      state: locationData.state,
      address_line: locationData.address_line,
      street: locationData.address_line,
      postal_code: locationData.postal_code,
      country: locationData.country,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      is_primary: locationData.is_default || false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedLocation = await this.locationsRepository.save(newLocation);
    return savedLocation;
  }

  async getUserLocations(userId: string) {
    await this.getUserById(userId);

    return this.locationsRepository.find({
      where: { user_id: parseInt(userId) },
      order: { is_primary: 'DESC', created_at: 'DESC' },
    });
  }

  async updateUserLocation(locationId: string, locationData: any) {
    const location = await this.locationsRepository.findOne({
      where: { id: parseInt(locationId) },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    await this.locationsRepository.update(locationId, {
      ...locationData,
      updated_at: new Date(),
    });

    return this.locationsRepository.findOne({
      where: { id: parseInt(locationId) },
    });
  }

  async deleteUserLocation(locationId: string) {
    const location = await this.locationsRepository.findOne({
      where: { id: parseInt(locationId) },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    await this.locationsRepository.delete(locationId);
    return { success: true, message: 'Location deleted successfully' };
  }

  // Payment Method Management
  async addPaymentMethod(
    userId: string,
    paymentData: {
      type: string;
      display_name: string;
      last_four_digits?: string;
      provider: string;
      is_default?: boolean;
      expires_at?: Date;
      metadata?: any;
    },
  ) {
    const user = await this.getUserById(userId);

    if (paymentData.is_default) {
      await this.paymentMethodsRepository.update(
        { user_id: parseInt(userId) },
        { is_default: false },
      );
    }

    const newPaymentMethod = new PaymentMethod();
    newPaymentMethod.user_id = parseInt(userId);
    newPaymentMethod.provider = paymentData.provider as PaymentProvider;
    newPaymentMethod.external_id = `ext_${Date.now()}`;
    // newPaymentMethod.last_four = paymentData.last_four_digits;
    // newPaymentMethod.cardholder_name = paymentData.display_name;
    // newPaymentMethod.is_default = paymentData.is_default || false;
    // newPaymentMethod.expiry_date = paymentData.expires_at
    //   ? this.formatExpiryDate(paymentData.expires_at)
    //   : null;
    // newPaymentMethod.metadata = paymentData.metadata
    //   ? JSON.stringify(paymentData.metadata)
    //   : null;
    newPaymentMethod.created_at = new Date();
    newPaymentMethod.updated_at = new Date();

    const savedPaymentMethod =
      await this.paymentMethodsRepository.save(newPaymentMethod);
    return savedPaymentMethod;
  }

  async getUserPaymentMethods(userId: string) {
    await this.getUserById(userId);

    return this.paymentMethodsRepository.find({
      where: { user_id: parseInt(userId), is_active: true },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async deletePaymentMethod(paymentMethodId: string) {
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { id: parseInt(paymentMethodId) },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        `Payment method with ID ${paymentMethodId} not found`,
      );
    }

    await this.paymentMethodsRepository.update(paymentMethodId, {
      is_active: false,
      updated_at: new Date(),
    });

    return { success: true, message: 'Payment method deleted successfully' };
  }

  // Statistics and Analytics
  async getUserStats(filters?: {
    date_range?: { start_time?: Date; end_time?: Date };
    role_filter?: UserRole;
  }) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (filters?.date_range?.start_time && filters?.date_range?.end_time) {
      queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
        start: filters.date_range.start_time,
        end: filters.date_range.end_time,
      });
    }

    const totalUsers = await queryBuilder.getCount();

    const activeUsers = await this.usersRepository.count({
      where: { status: UserStatus.ACTIVE },
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await this.usersRepository.count({
      where: {
        created_at: Between(startOfMonth, new Date()),
      },
    });

    const usersByRole = {};
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.usersRepository.count({ where: { role } });
    }

    const usersByStatus = {};
    for (const status of Object.values(UserStatus)) {
      usersByStatus[status] = await this.usersRepository.count({
        where: { status },
      });
    }

    const verifiedUsers = await this.usersRepository.count({
      where: { status: UserStatus.ACTIVE },
    });

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      new_users_this_month: newUsersThisMonth,
      users_by_role: usersByRole,
      users_by_status: usersByStatus,
      average_session_duration: 0,
      verified_users: verifiedUsers,
      unverified_users: totalUsers - verifiedUsers,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['locations', 'payment_methods'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userStats = {
      total_orders: 0, // TODO: Implement with orders service
      total_reviews: 0, // TODO: Implement with reviews service
      loyalty_points: user.points || 0,
      member_since: user.created_at,
    };

    return {
      user,
      stats: userStats,
    };
  }

  // Helper methods
  private formatExpiryDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
  }
}
