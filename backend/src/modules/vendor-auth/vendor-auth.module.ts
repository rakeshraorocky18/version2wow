import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';

import { User } from '../auth/entities/user.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      VendorEntity,
    ]),
  ],
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
})
export class VendorAuthModule {}