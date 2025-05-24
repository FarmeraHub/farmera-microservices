import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Verification, User])],
  controllers: [VerificationController],
  providers: [VerificationService, EmailService],
  exports: [VerificationService],
})
export class VerificationModule {}
