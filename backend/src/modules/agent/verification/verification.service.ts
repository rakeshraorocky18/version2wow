import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AadhaarVerificationEntity } from './verification.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';

@Injectable()
export class AadhaarVerificationService {
  constructor(
    @InjectRepository(AadhaarVerificationEntity, POSTGRES_CONNECTION)
    private readonly verificationRepo: Repository<AadhaarVerificationEntity>,
    @InjectRepository(AgentCustomerEntity, POSTGRES_CONNECTION)
    private readonly customerRepo: Repository<AgentCustomerEntity>,
  ) {}

  private getHash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private maskAadhaar(aadhaar: string): string {
    const digits = aadhaar.replace(/\s/g, '');
    return `XXXX XXXX ${digits.slice(-4)}`;
  }

  async sendOtp(
    aadhaarNumber: string,
    sessionId: string,
    agentId?: string,
  ): Promise<{ success: boolean; message: string; otp?: string }> {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Aadhaar must be exactly 12 numeric digits');
    }

    if (!sessionId) {
      throw new BadRequestException('SessionId is required for Aadhaar verification');
    }

    const mode = process.env.AADHAAR_MODE || 'development';

    if (mode === 'production') {
      // Real production Aadhaar provider integration placeholder
      throw new BadRequestException('Production Aadhaar verification integration is not implemented.');
    }

    // --- Development Mode ---

    const exists = await this.customerRepo.findOne({
      where: { aadhaarNumber, status: Not('Deleted' as any) },
    });
    if (exists) {
      throw new BadRequestException('Customer already exists. This Aadhaar is already registered.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const aadhaarHash = this.getHash(aadhaarNumber);
    const maskedAadhaar = this.maskAadhaar(aadhaarNumber);

    await this.verificationRepo.delete({ aadhaarHash });
    await this.verificationRepo.delete({ sessionId });

    const tempVerification = this.verificationRepo.create({
      aadhaarHash,
      maskedAadhaar,
      otp,
      sessionId,
      agentId,
      isVerified: false,
      expiresAt,
    });

    await this.verificationRepo.save(tempVerification);

    console.log('\n====================================');
    console.log('DEV AADHAAR OTP');
    console.log(`Aadhaar: ${maskedAadhaar}`);
    console.log(`OTP: ${otp}`);
    console.log('Expires: 5 minutes');
    console.log('====================================\n');

    return {
      success: true,
      message: 'Development OTP generated.',
      otp,
    };
  }

  async verifyOtp(
    aadhaarNumber: string,
    otp: string,
    sessionId: string,
  ): Promise<{ verified: boolean; message: string }> {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Aadhaar must be exactly 12 numeric digits');
    }

    if (!sessionId) {
      throw new BadRequestException('SessionId is required for Aadhaar verification');
    }

    const mode = process.env.AADHAAR_MODE || 'development';

    if (mode === 'production') {
      throw new BadRequestException('Production Aadhaar verification integration is not implemented.');
    }

    const aadhaarHash = this.getHash(aadhaarNumber);
    const record = await this.verificationRepo.findOne({
      where: { aadhaarHash, sessionId },
    });

    if (!record || !record.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const now = new Date();
    if (!record.expiresAt || record.expiresAt < now) {
      await this.verificationRepo.delete({ aadhaarHash, sessionId });
      throw new BadRequestException('OTP Expired');
    }

    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    record.isVerified = true;
    record.verifiedAt = new Date();
    record.expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.verificationRepo.save(record);

    return {
      verified: true,
      message: 'Aadhaar verified successfully.',
    };
  }

  async cleanupSession(sessionId: string): Promise<{ success: boolean }> {
    if (sessionId) {
      await this.verificationRepo.delete({ sessionId });
    }
    return { success: true };
  }
}
