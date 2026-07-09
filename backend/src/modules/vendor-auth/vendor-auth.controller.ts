import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { VendorAuthService } from './vendor-auth.service';
import { VendorRegisterDto } from './dto/vendor-auth.dto';
import { VendorLoginDto } from './dto/vendor-auth.dto';

@Controller('vendor-auth')
export class VendorAuthController {
  constructor(
    private readonly vendorAuthService: VendorAuthService,
  ) {}

  @Post('register')
  register(
    @Body() dto: VendorRegisterDto,
  ) {
    return this.vendorAuthService.register(dto);
  }

  @Post('login')
  login(
    @Body() dto: VendorLoginDto,
  ) {
    return this.vendorAuthService.login(dto);
  }
}