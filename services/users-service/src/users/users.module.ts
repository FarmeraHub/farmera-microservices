import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { HashService } from 'src/services/hash.service';
import { VerificationModule } from 'src/verification/verification.module';
import { Location } from './entities/location.entity';
import { PaymentMethod } from './entities/payment_method.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Location, PaymentMethod]),
    VerificationModule,
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, HashService],
  exports: [UsersService],
})
export class UsersModule {}
