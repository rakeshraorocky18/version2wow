import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AadhaarVerificationEntity } from './verification.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AadhaarVerificationService } from './verification.service';
import { AadhaarVerificationController } from './verification.controller';

import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature(
      [AadhaarVerificationEntity, AgentCustomerEntity],
      POSTGRES_CONNECTION,
    ),
  ],
  controllers: [AadhaarVerificationController],
  providers: [AadhaarVerificationService],
  exports: [AadhaarVerificationService],
})
export class AadhaarVerificationModule {}
