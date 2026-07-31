import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { MobileVerificationEntity } from './mobile-verification.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';

@Injectable()
export class MobileVerificationService {
  constructor(
    @InjectRepository(MobileVerificationEntity, POSTGRES_CONNECTION)
    private readonly verificationRepo: Repository<MobileVerificationEntity>,
    @InjectRepository(AgentCustomerEntity, POSTGRES_CONNECTION)
    private readonly customerRepo: Repository<AgentCustomerEntity>,
  ) {}

  private maskMobile(mobile: string): string {
    const digits = mobile.replace(/\D/g, '');
    return `******${digits.slice(-4)}`;
  }

  private validateMobileFormat(mobile: string) {
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestException('Mobile number must be exactly 10 numeric digits');
    }
  }

  async checkMobile(mobile: string): Promise<{ exists: boolean; message?: string }> {
    this.validateMobileFormat(mobile);

    const exists = await this.customerRepo
      .createQueryBuilder('c')
      .where("regexp_replace(c.phone, '\\D', '', 'g') LIKE :phone", { phone: `%${mobile}` })
      .getOne();

    if (exists) {
      return {
        exists: true,
        message: 'Mobile number already exists.',
      };
    }

    return { exists: false };
  }

  async sendOtp(mobile: string, sessionId: string, agentId?: string): Promise<{ success: boolean; message: string; otp?: string }> {
    const check = await this.checkMobile(mobile);
    if (check.exists) {
      throw new BadRequestException(check.message);
    }

    const mode = process.env.MOBILE_OTP_MODE || 'development';

    if (mode === 'production') {
      throw new BadRequestException('Production Mobile OTP verification integration is not implemented.');
    }

    // --- Development Mode ---

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing temporary records for this mobile or sessionId
    await this.verificationRepo.delete({ mobile });
    await this.verificationRepo.delete({ sessionId });

    // Create new temporary verification record
    const tempVerification = new MobileVerificationEntity();
    tempVerification.mobile = mobile;
    tempVerification.otp = otp;
    tempVerification.isVerified = false;
    tempVerification.expiresAt = expiresAt;
    tempVerification.sessionId = sessionId;
    tempVerification.agentId = agentId;

    await this.verificationRepo.save(tempVerification);

    // Print to backend console
    const maskedMobile = this.maskMobile(mobile);
    console.log('\n========================================');
    console.log('DEV MOBILE OTP');
    console.log(`Mobile: ${maskedMobile}`);
    console.log(`OTP: ${otp}`);
    console.log('Expires: 5 minutes');
    console.log('========================================\n');

    return {
      success: true,
      message: 'Development OTP generated.',
      otp, // return OTP in dev mode response so frontend can console.log it
    };
  }

  async verifyOtp(mobile: string, otp: string, sessionId: string): Promise<{ verified: boolean; message: string }> {
    this.validateMobileFormat(mobile);

    const mode = process.env.MOBILE_OTP_MODE || 'development';

    if (mode === 'production') {
      throw new BadRequestException('Production Mobile OTP verification integration is not implemented.');
    }

    // Find the temporary verification record
    const record = await this.verificationRepo.findOne({
      where: { mobile, sessionId },
    });

    if (!record) {
      throw new BadRequestException('Verification session not found.');
    }

    const now = new Date();
    if (record.expiresAt < now) {
      throw new BadRequestException('OTP has expired.');
    }

    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP.');
    }

    // Successful Verification: update states and extend expiration to allow registration form completion (15 mins)
    record.isVerified = true;
    record.verifiedAt = new Date();
    record.expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.verificationRepo.save(record);

    return {
      verified: true,
      message: 'Mobile number verified successfully.',
    };
  }

  async cleanupSession(sessionId: string): Promise<{ success: boolean }> {
    if (sessionId) {
      await this.verificationRepo.delete({ sessionId });
    }
    return { success: true };
  }
}
