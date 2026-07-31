import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AadhaarVerificationEntity } from './verification.entity';
import { MobileVerificationEntity } from './mobile-verification.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AadhaarVerificationService } from './verification.service';
import { AadhaarVerificationController } from './verification.controller';
import { MobileVerificationService } from './mobile-verification.service';
import { MobileVerificationController } from './mobile-verification.controller';

import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature(
      [AadhaarVerificationEntity, MobileVerificationEntity, AgentCustomerEntity],
      POSTGRES_CONNECTION,
    ),
  ],
  controllers: [AadhaarVerificationController, MobileVerificationController],
  providers: [AadhaarVerificationService, MobileVerificationService],
  exports: [AadhaarVerificationService, MobileVerificationService],
})
export class AadhaarVerificationModule {}
