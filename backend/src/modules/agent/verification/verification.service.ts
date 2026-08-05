import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { POSTGRES_CONNECTION } from '../../../config/database.constants';
import { AadhaarVerificationEntity } from './verification.entity';
import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';

@Injectable()
export class AadhaarVerificationService {
  // Temporary storage for OTPs in development mode
  // Key: SHA256 of full Aadhaar (to protect the Aadhaar number)
  private devOtps = new Map<string, { otp: string; expiresAt: Date }>();

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

  async sendOtp(aadhaarNumber: string): Promise<{ success: boolean; message: string; otp?: string }> {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Aadhaar must be exactly 12 numeric digits');
    }

    const mode = process.env.AADHAAR_MODE || 'development';

    if (mode === 'production') {
      // Real production Aadhaar provider integration placeholder
      throw new BadRequestException('Production Aadhaar verification integration is not implemented.');
    }

    // --- Development Mode ---

    // Check if customer with this Aadhaar is already registered
    const exists = await this.customerRepo.findOne({
      where: { aadhaarNumber },
    });
    if (exists) {
      throw new BadRequestException('Customer already exists. This Aadhaar is already registered.');
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const aadhaarHash = this.getHash(aadhaarNumber);
    const maskedAadhaar = this.maskAadhaar(aadhaarNumber);

    // Store temporarily in memory (automatically invalidates any previous OTP for this Aadhaar by key overwrite)
    this.devOtps.set(aadhaarHash, { otp, expiresAt });

    // Print to backend console (with masked Aadhaar)
    console.log('\n====================================');
    console.log('DEV AADHAAR OTP');
    console.log(`Aadhaar: ${maskedAadhaar}`);
    console.log(`OTP: ${otp}`);
    console.log('Expires: 5 minutes');
    console.log('====================================\n');

    return {
      success: true,
      message: 'Development OTP generated.',
      otp, // return OTP in dev mode response so frontend can console.log it
    };
  }

  async verifyOtp(aadhaarNumber: string, otp: string): Promise<{ verified: boolean; message: string }> {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new BadRequestException('Aadhaar must be exactly 12 numeric digits');
    }

    const mode = process.env.AADHAAR_MODE || 'development';

    if (mode === 'production') {
      throw new BadRequestException('Production Aadhaar verification integration is not implemented.');
    }

    // --- Development Mode ---

    const aadhaarHash = this.getHash(aadhaarNumber);
    const stored = this.devOtps.get(aadhaarHash);

    if (!stored) {
      throw new BadRequestException('Invalid OTP'); // No OTP generated for this Aadhaar
    }

    if (new Date() > stored.expiresAt) {
      this.devOtps.delete(aadhaarHash);
      throw new BadRequestException('OTP Expired');
    }

    if (stored.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Successful Verification
    this.devOtps.delete(aadhaarHash); // Clean up transient OTP

    const maskedAadhaar = this.maskAadhaar(aadhaarNumber);

    // Save/update verification status in database
    let verification = await this.verificationRepo.findOne({
      where: { maskedAadhaar },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        maskedAadhaar,
        isVerified: true,
        verifiedAt: new Date(),
      });
    } else {
      verification.isVerified = true;
      verification.verifiedAt = new Date();
    }

    await this.verificationRepo.save(verification);

    return {
      verified: true,
      message: 'Aadhaar verified successfully.',
    };
  }
}
