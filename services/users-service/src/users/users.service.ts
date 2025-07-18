import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateUserDto, CreateUserSignUpDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { PaymentMethod } from './entities/payment_method.entity';
import { VerificationService } from 'src/verification/verification.service';
import { UserRole } from 'src/enums/roles.enum';
import { HashService } from 'src/services/hash.service';
import { UserStatus } from 'src/enums/status.enum';
import { JwtDecoded } from 'src/guards/jwt.strategy';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdatePaymentMethodDto } from './dto/payment-method.dto';
import { UserLite } from './dto/user-lite.dto';

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
  ) { }

  async createUserSignUp(createUserSignUpDto: CreateUserSignUpDto) {
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

  async getUserById(id: string, location?: boolean, paymentMethod?: boolean): Promise<User> {
    const relations = [];
    if (location) relations.push("locations");
    if (paymentMethod) relations.push("payment_methods");
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: relations,
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
  async updateUser(
    id: string,
    updateData: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.getUserById(id);

    const updateFields: any = { updated_at: new Date() };

    if (updateData.first_name) updateFields.first_name = updateData.first_name;
    if (updateData.last_name) updateFields.last_name = updateData.last_name;
    if (updateData.gender) updateFields.gender = updateData.gender;
    if (updateData.avatar) updateFields.avatar = updateData.avatar;
    if (updateData.birthday) updateFields.birthday = updateData.birthday;

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
      sort_by?: string;
      sort_order?: "ASC" | "DESC"
      created_date_range?: { start_time?: Date; end_time?: Date };
    } = {},
  ) {
    const validOrder = ["id", "email", "first_name", "last_name", "gender", "role", "status", "updated_at", "created_at", "points"]
    const {
      page = 1,
      limit = 10,
      role_filter,
      status_filter,
      search_query,
      created_date_range,
      sort_by,
      sort_order = "ASC"
    } = filters;
    if (sort_by && !validOrder.includes(sort_by)) throw new BadRequestException(`Invalid properties ${sort_by}`)

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
    if (sort_by) {
      switch (sort_by) {
        case "id":
          queryBuilder.orderBy('user.id', sort_order);
          break;
        case "email":
          queryBuilder.orderBy('user.email', sort_order);
          break;
        case "first_name":
          queryBuilder.orderBy('user.first_name', sort_order);
          break;
        case "last_name":
          queryBuilder.orderBy('user.last_name', sort_order);
          break;
        case "gender":
          queryBuilder.orderBy('user.gender', sort_order);
          break;
        case "role":
          queryBuilder.orderBy('user.role', sort_order);
          break;
        case "status":
          queryBuilder.orderBy('user.status', sort_order);
          break;
        case "updated_at":
          queryBuilder.orderBy('user.updated_at', sort_order);
          break;
        case "created_at":
          queryBuilder.orderBy('user.created_at', sort_order);
          break;
        case "points":
          queryBuilder.orderBy('user.points', sort_order);
          break;
        default:
          throw new BadRequestException(`Invalid sort_by value: ${sort_by}`);
      }
    } else {
      queryBuilder.orderBy('user.created_at', 'DESC');
    }

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

    return this.getUserById(id);
  }

  async updateUserRole(
    id: string,
    role: UserRole,
    farmId?: string,
  ): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) throw new NotFoundException("User not found");

    if (role === UserRole.FARMER && !farmId)
      throw new BadRequestException("Cannot update to farmer role because farm ID is not specified")

    const updateData: any = {
      role,
      updated_at: new Date(),
    };

    // If farmId is provided, update it as well
    if (farmId) {
      updateData.farm_id = farmId;
    }

    await this.usersRepository.update(id, updateData);

    return this.getUserById(id);
  }

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['locations', 'payment_methods'],
    });

    if (!user) {
      throw new NotFoundException(`User with this email not found`);
    }

    return user;
  }

  // Location Management
  async addUserLocation(
    userId: string,
    locationData: CreateLocationDto,
  ): Promise<Location> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (locationData.is_primary) {
      await this.locationsRepository.update(
        { user: { id: userId } },
        { is_primary: false, updated_at: new Date() },
      );
    }

    const newLocation = this.locationsRepository.create({
      user: { id: userId },
      city: locationData.city,
      district: locationData.district,
      address_line: locationData.address_line,
      street: locationData.address_line,
      ward: locationData.ward,
      type: locationData.type,
      is_primary: locationData.is_primary || false,
      name: locationData.name,
      phone: locationData.phone,
    });

    const savedLocation = await this.locationsRepository.save(newLocation);
    return savedLocation;
  }

  async getUserLocations(userId: string): Promise<Location[]> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.locationsRepository.find({
      where: { user: { id: userId } },
      order: { is_primary: 'DESC', created_at: 'DESC' },
    });
  }

  async updateUserLocation(
    locationId: number,
    userId: string,
    locationData: UpdateAddressDto,
  ) {
    const location = await this.locationsRepository.findOne({
      where: { location_id: locationId, user: { id: userId } },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // If setting this as primary, unset other primary locations for this user
    if (locationData.is_primary) {
      await this.locationsRepository.update(
        { user: { id: userId } },
        { is_primary: false, updated_at: new Date() },
      );
    }

    await this.locationsRepository.update(locationId, {
      ...locationData,
      updated_at: new Date(),
    });

    return this.locationsRepository.findOne({
      where: { location_id: locationId },
    });
  }

  async deleteUserLocation(userId: string, locationId: number) {
    const location = await this.locationsRepository.findOne({
      where: { location_id: locationId, user: { id: userId } },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    await this.locationsRepository.delete(locationId);
    return { success: true, message: 'Location deleted successfully' };
  }

  async findLocationById(locationId: number) {
    return await this.locationsRepository.findOne({
      where: { location_id: locationId },
    });
  }

  // Payment Method Management
  async addPaymentMethod(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentMethod> {
    const user = await this.getUserById(userId);

    if (createPaymentDto.is_default) {
      await this.paymentMethodsRepository.update(
        { user: { id: userId } },
        { is_default: false },
      );
    }

    const newPaymentMethod =
      this.paymentMethodsRepository.create(createPaymentDto);
    newPaymentMethod.user = user;

    return await this.paymentMethodsRepository.save(newPaymentMethod);
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodsRepository.find({
      where: { user: { id: userId }, is_active: true },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: number,
    paymentData: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { payment_method_id: paymentMethodId, user: { id: userId } },
    });

    if (!paymentMethod) {
      throw new NotFoundException(
        `Payment method with ID ${paymentMethodId} not found`,
      );
    }

    // If setting this as default, unset other default payment methods for this user
    if (paymentData.is_default) {
      await this.paymentMethodsRepository.update(
        { user: { id: userId } },
        { is_default: false },
      );
    }

    await this.paymentMethodsRepository.update(paymentMethodId, {
      ...paymentData,
      updated_at: new Date(),
    });

    return await this.paymentMethodsRepository.findOne({
      where: { payment_method_id: paymentMethodId },
    });
  }

  async deletePaymentMethod(paymentMethodId: number) {
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { payment_method_id: paymentMethodId },
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

  async getUserLite(id: string): Promise<UserLite> {
    const user = await this.usersRepository.findOne({ where: { id: id } });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        farm_id: user.farm_id,
        avatar: user.avatar,
      }
    }
    throw new NotFoundException("User not found");
  }
}
