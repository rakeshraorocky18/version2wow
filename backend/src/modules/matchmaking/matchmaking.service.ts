import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { MatchStatus } from '../../common/enums';
import { SendInterestDto } from './dto/matchmaking.dto';
import { UsersService } from '../users/users.service.typeorm';

@Injectable()
export class MatchmakingService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private usersService: UsersService,
  ) {}

  async sendInterest(senderId: string, dto: SendInterestDto): Promise<Match> {
    const existingMatch = await this.matchRepository.findOne({
      where: [
        { senderId, receiverId: dto.receiverId },
        { senderId: dto.receiverId, receiverId: senderId },
      ],
    });

    if (existingMatch) {
      throw new ConflictException('Interest already exists between these users');
    }

    const match = this.matchRepository.create({
      senderId,
      receiverId: dto.receiverId,
      message: dto.message,
      status: MatchStatus.PENDING,
    });

    return this.matchRepository.save(match);
  }

  async acceptInterest(userId: string, matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, receiverId: userId },
    });

    if (!match) {
      throw new NotFoundException('Match request not found');
    }

    match.status = MatchStatus.ACCEPTED;
    return this.matchRepository.save(match);
  }

  async rejectInterest(userId: string, matchId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, receiverId: userId },
    });

    if (!match) {
      throw new NotFoundException('Match request not found');
    }

    match.status = MatchStatus.REJECTED;
    return this.matchRepository.save(match);
  }

  async getReceivedInterests(userId: string): Promise<Match[]> {
    return this.matchRepository.find({
      where: { receiverId: userId, status: MatchStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async getSentInterests(userId: string): Promise<Match[]> {
    return this.matchRepository.find({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAcceptedMatches(userId: string): Promise<Match[]> {
    return this.matchRepository.find({
      where: [
        { senderId: userId, status: MatchStatus.ACCEPTED },
        { receiverId: userId, status: MatchStatus.ACCEPTED },
      ],
      order: { updatedAt: 'DESC' },
    });
  }

  async getSuggestedMatches(userId: string, page = 1, limit = 20) {
    const userProfile = await this.usersService.getProfile(userId);
    const filters: any = {};

    if (userProfile.gender === 'male') {
      filters.gender = 'female';
    } else if (userProfile.gender === 'female') {
      filters.gender = 'male';
    }
    if (userProfile.religion) {
      filters.religion = userProfile.religion;
    }
    if (userProfile.prefLocations?.length) {
      filters.city = userProfile.prefLocations[0];
    }

    const result = await this.usersService.searchProfiles(filters, page, limit);

    // Calculate compatibility scores
    const scoredProfiles = result.profiles.map((candidate) => ({
      ...candidate,
      compatibilityScore: this.calculateCompatibility(userProfile, candidate),
    }));

    scoredProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return { profiles: scoredProfiles, total: result.total };
  }

  private calculateCompatibility(user: any, candidate: any): number {
    let score = 0;
    let factors = 0;

    // Religion match (20 points)
    factors++;
    if (user.religion && candidate.religion && user.religion === candidate.religion) score += 20;

    // Location match (15 points)
    factors++;
    if (user.city && candidate.city) {
      if (user.city === candidate.city) score += 15;
      else if (user.state && candidate.state && user.state === candidate.state) score += 8;
    }

    // Education match (10 points)
    factors++;
    if (user.education && candidate.education && user.education === candidate.education) score += 10;

    // Diet match (10 points)
    factors++;
    if (user.diet && candidate.diet && user.diet === candidate.diet) score += 10;

    // Mother tongue match (10 points)
    factors++;
    if (user.motherTongue && candidate.motherTongue && user.motherTongue === candidate.motherTongue) score += 10;

    // Age preference match (15 points)
    if (user.prefAgeMin || user.prefAgeMax) {
      factors++;
      if (candidate.dateOfBirth) {
        const age = this.calculateAge(candidate.dateOfBirth);
        const inMin = !user.prefAgeMin || age >= user.prefAgeMin;
        const inMax = !user.prefAgeMax || age <= user.prefAgeMax;
        if (inMin && inMax) score += 15;
        else if (inMin || inMax) score += 7;
      }
    }

    // Height preference (10 points)
    if (user.prefHeightMin || user.prefHeightMax) {
      factors++;
      if (candidate.height) {
        const inMin = !user.prefHeightMin || candidate.height >= user.prefHeightMin;
        const inMax = !user.prefHeightMax || candidate.height <= user.prefHeightMax;
        if (inMin && inMax) score += 10;
      }
    }

    // Family type match (5 points)
    factors++;
    if (user.familyType && candidate.familyType && user.familyType === candidate.familyType) score += 5;

    // Interests overlap (5 points)
    if (user.interests?.length && candidate.interests?.length) {
      factors++;
      const overlap = user.interests.filter((i: string) => candidate.interests?.includes(i));
      if (overlap.length > 0) score += Math.min(5, overlap.length * 2);
    }

    const maxScore = factors * 12.5; // Normalize
    return Math.round((score / Math.max(maxScore, 1)) * 100);
  }

  private calculateAge(dob: string): number {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }
}
