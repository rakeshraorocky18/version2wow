import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';

import { User } from '../auth/entities/user.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { AuthModule } from '../auth/auth.module';
import { POSTGRES_CONNECTION, SQLITE_CONNECTION } from '../../config/database.constants';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User], POSTGRES_CONNECTION),
    TypeOrmModule.forFeature([VendorEntity], SQLITE_CONNECTION),
  ],
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
})
export class VendorAuthModule {}