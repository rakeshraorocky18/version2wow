import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { WizardProfileDto } from './dto/wizard-profile.dto';
import { toPublicUrl } from './profile-upload.config';
import { UploadedFile } from './types/uploaded-file.type';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly maxProfilePhotos = 6;

  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepository: Repository<ProfileEntity>,
  ) {}

  async onModuleInit() {
    await this.repairCorruptedPhotos();
    await this.migrateProfilePhotoFields();
  }

  private async migrateProfilePhotoFields() {
    const profiles = await this.profileRepository.find();
    for (const profile of profiles) {
      const gallery = this.sanitizePhotos(profile.photos) || [];
      let changed = false;
      if (!profile.profilePhoto && gallery.length > 0) {
        profile.profilePhoto = gallery[0];
        profile.photos = gallery.slice(1);
        changed = true;
      }
      if (!profile.galleryVisibility) {
        profile.galleryVisibility = 'matched_only';
        changed = true;
      }
      if (changed) {
        await this.profileRepository.save(profile);
      }
    }
  }

  private async repairCorruptedPhotos() {
    await this.profileRepository.query(
      `UPDATE profiles
       SET photos = NULL
       WHERE photos IS NOT NULL
         AND (
           photos LIKE 'data:%'
           OR (photos NOT LIKE '[%' AND photos NOT LIKE '/uploads%')
         )`,
    );
  }

  private sanitizePhotos(photos?: string[] | null): string[] | undefined {
    if (!photos?.length) return undefined;
    const cleaned = photos.filter((p) => typeof p === 'string' && p.length > 0 && !p.startsWith('data:'));
    return cleaned.length ? cleaned : undefined;
  }

  private countProfilePhotos(profile: ProfileEntity): number {
    const gallery = this.sanitizePhotos(profile.photos) || [];
    const galleryOnly = profile.profilePhoto
      ? gallery.filter((p) => p !== profile.profilePhoto)
      : gallery;
    return (profile.profilePhoto ? 1 : 0) + galleryOnly.length;
  }

  private assertCanAddProfilePhoto(profile: ProfileEntity): void {
    if (this.countProfilePhotos(profile) >= this.maxProfilePhotos) {
      throw new BadRequestException(
        `Maximum ${this.maxProfilePhotos} profile photos allowed. Remove a photo before uploading another.`,
      );
    }
  }

  async createProfile(userId: string, dto: CreateProfileDto): Promise<ProfileEntity> {
    const existing = await this.profileRepository.findOne({ where: { userId } });
    if (existing) {
      return this.updateProfile(userId, dto);
    }

    const profile = this.profileRepository.create({
      userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName,
      displayName: dto.displayName,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      phone: dto.phone,
      email: dto.email,
      religion: dto.religion,
      religionOther: dto.religionOther,
      caste: dto.caste,
      subCaste: dto.subCaste,
      motherTongue: dto.motherTongue,
      community: dto.community,
      education: dto.education,
      highestQualification: dto.highestQualification,
      qualificationOther: dto.qualificationOther,
      degreeName: dto.degreeName,
      specialization: dto.specialization,
      collegeUniversity: dto.collegeUniversity,
      passingYear: dto.passingYear,
      gradeCgpa: dto.gradeCgpa,
      occupation: dto.occupation,
      currentlyWorking: dto.currentlyWorking || false,
      companyName: dto.companyName,
      jobTitle: dto.jobTitle,
      industry: dto.industry,
      annualIncome: dto.annualIncome,
      yearsOfExperience: dto.yearsOfExperience,
      workLocation: dto.workLocation,
      currentStatus: dto.currentStatus,
      currentStatusOther: dto.currentStatusOther,
      income: dto.income,
      height: dto.height,
      weight: dto.weight,
      bodyType: dto.bodyType,
      complexion: dto.complexion,
      bloodGroup: dto.bloodGroup,
      physicalStatus: dto.physicalStatus,
      disabilityDetails: dto.disabilityDetails,
      city: dto.location?.city,
      state: dto.location?.state,
      country: dto.location?.country || 'India',
      address: dto.address,
      pincode: dto.pincode || dto.location?.pincode,
      bio: dto.bio,
      horoscopeAvailable: dto.horoscopeAvailable || false,
      rashi: dto.rashi,
      nakshatra: dto.nakshatra,
      gothram: dto.gothram,
      manglik: dto.manglik,
      zodiacSign: dto.zodiacSign,
      timeOfBirth: dto.timeOfBirth,
      placeOfBirth: dto.placeOfBirth,
      horoscopeFileUrl: dto.horoscopeFileUrl,
      maritalStatus: dto.maritalStatus,
      yearsMarried: dto.yearsMarried,
      haveChildren: dto.haveChildren || false,
      childrenLivingWith: dto.childrenLivingWith,
      numberOfChildren: dto.numberOfChildren,
      childrenBoys: dto.childrenBoys,
      childrenGirls: dto.childrenGirls,
      readyForRemarriage: dto.readyForRemarriage || false,
      familyType: dto.familyType || dto.familyDetails?.familyType,
      familyValues: dto.familyValues,
      familyStatus: dto.familyStatus || dto.familyDetails?.familyStatus,
      fatherName: dto.fatherName || dto.familyDetails?.fatherName,
      fatherAlive: dto.fatherAlive ?? true,
      fatherOccupation: dto.fatherOccupation,
      motherName: dto.motherName || dto.familyDetails?.motherName,
      motherAlive: dto.motherAlive ?? true,
      motherOccupation: dto.motherOccupation,
      siblings: dto.familyDetails?.siblings,
      brothers: dto.brothers,
      marriedBrothers: dto.marriedBrothers,
      sisters: dto.sisters,
      marriedSisters: dto.marriedSisters,
      siblingDetails: dto.siblingDetails || dto.familyDetails?.siblingDetails as Record<string, unknown>[] | undefined,
      diet: dto.diet,
      drinking: dto.drinking,
      smoking: dto.smoking,
      interests: dto.interests,
      photos: this.sanitizePhotos(dto.photos),
      prefAgeMin: dto.prefAgeMin || dto.preferences?.ageRange?.min,
      prefAgeMax: dto.prefAgeMax || dto.preferences?.ageRange?.max,
      prefHeightMin: dto.prefHeightMin || dto.preferences?.heightRange?.min,
      prefHeightMax: dto.prefHeightMax || dto.preferences?.heightRange?.max,
      prefMaritalStatuses: dto.prefMaritalStatuses,
      prefReligions: dto.prefReligions || dto.preferences?.religions,
      prefCastes: dto.prefCastes,
      prefLocations: dto.prefLocations || dto.preferences?.locations,
      prefCities: dto.prefCities,
      prefFamilyType: dto.prefFamilyType,
      prefFamilyStatus: dto.prefFamilyStatus,
    });
    return this.profileRepository.save(profile).then((saved) => this.formatProfileResponse(saved));
  }

  async getProfileOrNull(userId: string): Promise<(ProfileEntity & { wizardProfile: Record<string, unknown> }) | null> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) return null;
    return this.formatProfileResponse(profile);
  }

  async setPremiumStatus(userId: string, isPremium: boolean) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.isPremium = isPremium;
    if (!isPremium && profile.subscriptionType !== 'Free') {
      profile.subscriptionType = 'Free';
    } else if (isPremium && profile.subscriptionType === 'Free') {
      profile.subscriptionType = 'Premium';
    }
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async setSubscription(userId: string, subscriptionType: string) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.subscriptionType = subscriptionType;
    profile.isPremium = subscriptionType !== 'Free';
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async activateProfileBoost(userId: string, durationHours = 24) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    const now = Date.now();
    const currentExpiry = profile.boostExpiresAt ? new Date(profile.boostExpiresAt).getTime() : 0;
    const base = Math.max(now, currentExpiry);
    profile.boostExpiresAt = new Date(base + durationHours * 60 * 60 * 1000);
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async clearExpiredBoost(userId: string) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile?.boostExpiresAt) return profile;
    if (new Date(profile.boostExpiresAt).getTime() <= Date.now()) {
      profile.boostExpiresAt = null;
      return this.profileRepository.save(profile);
    }
    return profile;
  }

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<ProfileEntity & { wizardProfile: Record<string, unknown> }> {
    let profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepository.create({
        userId,
        firstName: 'User',
        lastName: 'Profile',
        country: 'India',
        profilePhoto: photoUrl,
        photos: [],
        galleryVisibility: 'matched_only',
        horoscopeAvailable: false,
        haveChildren: false,
        readyForRemarriage: false,
        fatherAlive: true,
        motherAlive: true,
        isVisible: true,
      });
    } else {
      if (!profile.profilePhoto && this.countProfilePhotos(profile) >= this.maxProfilePhotos) {
        throw new BadRequestException(
          `Maximum ${this.maxProfilePhotos} profile photos allowed. Remove a photo before uploading another.`,
        );
      }
      profile.profilePhoto = photoUrl;
    }
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async addGalleryPhoto(userId: string, photoUrl: string): Promise<ProfileEntity & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    this.assertCanAddProfilePhoto(profile);

    const current = this.sanitizePhotos(profile.photos) || [];
    if (current.includes(photoUrl) || profile.profilePhoto === photoUrl) {
      throw new BadRequestException('Photo already exists');
    }
    profile.photos = [...current, photoUrl];
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async removeGalleryPhoto(
    userId: string,
    photoUrl: string,
  ): Promise<ProfileEntity & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const current = this.sanitizePhotos(profile.photos) || [];
    const next = current.filter((p) => p !== photoUrl);
    if (next.length === current.length) {
      throw new NotFoundException('Photo not found in gallery');
    }
    profile.photos = next;
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async setGalleryVisibility(
    userId: string,
    visibility: 'public' | 'matched_only',
  ): Promise<ProfileEntity & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.galleryVisibility = visibility;
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  async getProfile(userId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.formatProfileResponse(profile);
  }

  async getProfileById(profileId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.formatProfileResponse(profile);
  }

  /** Resolve profile by entity id or auth user id (for match links). */
  async getProfileByIdOrUserId(idOrUserId: string): Promise<ProfileEntity> {
    const byId = await this.profileRepository.findOne({ where: { id: idOrUserId } });
    if (byId) return this.formatProfileResponse(byId);
    const byUser = await this.profileRepository.findOne({ where: { userId: idOrUserId } });
    if (byUser) return this.formatProfileResponse(byUser);
    throw new NotFoundException('Profile not found');
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      return this.createProfile(userId, {
        ...dto,
        firstName: dto.firstName || 'User',
        lastName: dto.lastName || 'Profile',
      });
    }

    if (dto.firstName !== undefined) profile.firstName = dto.firstName;
    if (dto.lastName !== undefined) profile.lastName = dto.lastName;
    if (dto.dateOfBirth !== undefined) profile.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) profile.gender = dto.gender;
    if (dto.religion !== undefined) profile.religion = dto.religion;
    if (dto.religionOther !== undefined) profile.religionOther = dto.religionOther;
    if (dto.caste !== undefined) profile.caste = dto.caste;
    if (dto.motherTongue !== undefined) profile.motherTongue = dto.motherTongue;
    if (dto.education !== undefined) profile.education = dto.education;
    if (dto.highestQualification !== undefined) profile.highestQualification = dto.highestQualification;
    if (dto.qualificationOther !== undefined) profile.qualificationOther = dto.qualificationOther;
    if (dto.degreeName !== undefined) profile.degreeName = dto.degreeName;
    if (dto.specialization !== undefined) profile.specialization = dto.specialization;
    if (dto.collegeUniversity !== undefined) profile.collegeUniversity = dto.collegeUniversity;
    if (dto.passingYear !== undefined) profile.passingYear = dto.passingYear;
    if (dto.gradeCgpa !== undefined) profile.gradeCgpa = dto.gradeCgpa;
    if (dto.occupation !== undefined) profile.occupation = dto.occupation;
    if (dto.currentlyWorking !== undefined) profile.currentlyWorking = dto.currentlyWorking;
    if (dto.companyName !== undefined) profile.companyName = dto.companyName;
    if (dto.jobTitle !== undefined) profile.jobTitle = dto.jobTitle;
    if (dto.industry !== undefined) profile.industry = dto.industry;
    if (dto.annualIncome !== undefined) profile.annualIncome = dto.annualIncome;
    if (dto.yearsOfExperience !== undefined) profile.yearsOfExperience = dto.yearsOfExperience;
    if (dto.workLocation !== undefined) profile.workLocation = dto.workLocation;
    if (dto.currentStatus !== undefined) profile.currentStatus = dto.currentStatus;
    if (dto.currentStatusOther !== undefined) profile.currentStatusOther = dto.currentStatusOther;
    if (dto.income !== undefined) profile.income = dto.income;
    if (dto.height !== undefined) profile.height = dto.height;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.interests !== undefined) profile.interests = dto.interests;
    if (dto.photos !== undefined) profile.photos = this.sanitizePhotos(dto.photos) ?? [];
    if (dto.middleName !== undefined) profile.middleName = dto.middleName;
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.email !== undefined) profile.email = dto.email;
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.pincode !== undefined) profile.pincode = dto.pincode;
    if (dto.weight !== undefined) profile.weight = dto.weight;
    if (dto.bodyType !== undefined) profile.bodyType = dto.bodyType;
    if (dto.complexion !== undefined) profile.complexion = dto.complexion;
    if (dto.bloodGroup !== undefined) profile.bloodGroup = dto.bloodGroup;
    if (dto.physicalStatus !== undefined) profile.physicalStatus = dto.physicalStatus;
    if (dto.disabilityDetails !== undefined) profile.disabilityDetails = dto.disabilityDetails;
    if (dto.horoscopeAvailable !== undefined) profile.horoscopeAvailable = dto.horoscopeAvailable;
    if (dto.rashi !== undefined) profile.rashi = dto.rashi;
    if (dto.nakshatra !== undefined) profile.nakshatra = dto.nakshatra;
    if (dto.gothram !== undefined) profile.gothram = dto.gothram;
    if (dto.manglik !== undefined) profile.manglik = dto.manglik;
    if (dto.zodiacSign !== undefined) profile.zodiacSign = dto.zodiacSign;
    if (dto.horoscope !== undefined) {
      profile.horoscope = dto.horoscope;
      if (!dto.zodiacSign) profile.zodiacSign = dto.horoscope;
    }
    if (dto.siblings !== undefined) profile.siblings = dto.siblings;
    if (dto.country !== undefined) profile.country = dto.country;
    if (dto.state !== undefined) profile.state = dto.state;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.timeOfBirth !== undefined) profile.timeOfBirth = dto.timeOfBirth;
    if (dto.placeOfBirth !== undefined) profile.placeOfBirth = dto.placeOfBirth;
    if (dto.horoscopeFileUrl !== undefined) profile.horoscopeFileUrl = dto.horoscopeFileUrl;
    if (dto.subCaste !== undefined) profile.subCaste = dto.subCaste;
    if (dto.community !== undefined) profile.community = dto.community;
    if (dto.maritalStatus !== undefined) profile.maritalStatus = dto.maritalStatus;
    if (dto.yearsMarried !== undefined) profile.yearsMarried = dto.yearsMarried;
    if (dto.haveChildren !== undefined) profile.haveChildren = dto.haveChildren;
    if (dto.childrenLivingWith !== undefined) profile.childrenLivingWith = dto.childrenLivingWith;
    if (dto.numberOfChildren !== undefined) profile.numberOfChildren = dto.numberOfChildren;
    if (dto.childrenBoys !== undefined) profile.childrenBoys = dto.childrenBoys;
    if (dto.childrenGirls !== undefined) profile.childrenGirls = dto.childrenGirls;
    if (dto.readyForRemarriage !== undefined) profile.readyForRemarriage = dto.readyForRemarriage;
    if (dto.familyType !== undefined) profile.familyType = dto.familyType;
    if (dto.familyValues !== undefined) profile.familyValues = dto.familyValues;
    if (dto.familyStatus !== undefined) profile.familyStatus = dto.familyStatus;
    if (dto.fatherName !== undefined) profile.fatherName = dto.fatherName;
    if (dto.fatherAlive !== undefined) profile.fatherAlive = dto.fatherAlive;
    if (dto.fatherOccupation !== undefined) profile.fatherOccupation = dto.fatherOccupation;
    if (dto.motherName !== undefined) profile.motherName = dto.motherName;
    if (dto.motherAlive !== undefined) profile.motherAlive = dto.motherAlive;
    if (dto.motherOccupation !== undefined) profile.motherOccupation = dto.motherOccupation;
    if (dto.brothers !== undefined) profile.brothers = dto.brothers;
    if (dto.marriedBrothers !== undefined) profile.marriedBrothers = dto.marriedBrothers;
    if (dto.sisters !== undefined) profile.sisters = dto.sisters;
    if (dto.marriedSisters !== undefined) profile.marriedSisters = dto.marriedSisters;
    if (dto.siblingDetails !== undefined) profile.siblingDetails = dto.siblingDetails;
    if (dto.familyDetails?.siblingDetails !== undefined) {
      profile.siblingDetails = dto.familyDetails.siblingDetails as Record<string, unknown>[];
    }
    if (dto.diet !== undefined) profile.diet = dto.diet;
    if (dto.drinking !== undefined) profile.drinking = dto.drinking;
    if (dto.smoking !== undefined) profile.smoking = dto.smoking;
    if (dto.prefAgeMin !== undefined) profile.prefAgeMin = dto.prefAgeMin;
    if (dto.prefAgeMax !== undefined) profile.prefAgeMax = dto.prefAgeMax;
    if (dto.prefHeightMin !== undefined) profile.prefHeightMin = dto.prefHeightMin;
    if (dto.prefHeightMax !== undefined) profile.prefHeightMax = dto.prefHeightMax;
    if (dto.prefMaritalStatuses !== undefined) profile.prefMaritalStatuses = dto.prefMaritalStatuses;
    if (dto.prefReligions !== undefined) profile.prefReligions = dto.prefReligions;
    if (dto.prefCastes !== undefined) profile.prefCastes = dto.prefCastes;
    if (dto.prefLocations !== undefined) profile.prefLocations = dto.prefLocations;
    if (dto.prefCities !== undefined) profile.prefCities = dto.prefCities;
    if (dto.prefFamilyType !== undefined) profile.prefFamilyType = dto.prefFamilyType;
    if (dto.prefFamilyStatus !== undefined) profile.prefFamilyStatus = dto.prefFamilyStatus;
    if (dto.location?.city !== undefined) profile.city = dto.location.city;
    if (dto.location?.state !== undefined) profile.state = dto.location.state;
    if (dto.location?.country !== undefined) profile.country = dto.location.country;
    if (dto.location?.pincode !== undefined) profile.pincode = dto.location.pincode;

    profile.isComplete = this.isProfileComplete(profile);
    this.syncDerivedProfileFields(profile);
    const saved = await this.profileRepository.save(profile);
    return this.formatProfileResponse(saved);
  }

  private isProfileComplete(profile: ProfileEntity): boolean {
    return Boolean(
      profile.firstName?.trim() &&
        profile.lastName?.trim() &&
        profile.gender &&
        profile.dateOfBirth &&
        profile.religion?.trim() &&
        profile.maritalStatus?.trim() &&
        profile.city?.trim() &&
        profile.state?.trim() &&
        profile.country?.trim(),
    );
  }

  async saveWizardProfile(
    userId: string,
    dto: WizardProfileDto,
    files?: { profilePhoto?: UploadedFile; resume?: UploadedFile },
  ): Promise<ProfileEntity> {
    const pd = dto.personalDetails;
    if (!pd?.firstName?.trim() || !pd?.lastName?.trim()) {
      throw new BadRequestException('First name and last name are required');
    }
    if (!pd?.gender) {
      throw new BadRequestException('Gender is required');
    }
    if (!pd?.dateOfBirth) {
      throw new BadRequestException('Date of birth is required');
    }
    if (!pd?.email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    let existing = await this.profileRepository.findOne({ where: { userId } });

    const photoUrl = files?.profilePhoto
      ? toPublicUrl(`profiles/${files.profilePhoto.filename}`)
      : dto.existingPhotoUrl || dto.profilePhotoUrl || existing?.photos?.[0] || null;

    const resumeUrl = files?.resume
      ? toPublicUrl(`resumes/${files.resume.filename}`)
      : dto.experience?.resumeUrl || existing?.resumeUrl || null;

    const experience = {
      ...(dto.experience || {}),
      resumeUrl: resumeUrl || undefined,
    };

    const profileData: Partial<ProfileEntity> = {
      userId,
      firstName: pd.firstName.trim(),
      lastName: pd.lastName.trim(),
      displayName: pd.displayName?.trim() || `${pd.firstName} ${pd.lastName}`.trim(),
      dateOfBirth: pd.dateOfBirth,
      gender: pd.gender as ProfileEntity['gender'],
      phone: pd.phone?.trim(),
      email: pd.email?.trim(),
      city: pd.city?.trim(),
      state: pd.state?.trim(),
      country: pd.country?.trim() || 'India',
      address: pd.address?.trim(),
      languagesKnown: pd.languagesKnown || [],
      educationList: (dto.education || []) as Record<string, unknown>[],
      experience: experience as Record<string, unknown>,
      expressYourself: (dto.expressYourself || {}) as Record<string, unknown>,
      interests: dto.hobbies || [],
      photos: photoUrl ? [photoUrl] : existing?.photos || [],
      resumeUrl: resumeUrl || undefined,
      education: this.summarizeEducation(dto.education),
      occupation: dto.experience?.currentlyWorking ? dto.experience.jobTitle : undefined,
      income: dto.experience?.currentlyWorking ? dto.experience.currentSalary : undefined,
      bio: dto.expressYourself?.aboutMe,
      isComplete: true,
    };

    if (existing) {
      Object.assign(existing, profileData);
      const saved = await this.profileRepository.save(existing);
      return this.formatProfileResponse(saved);
    }

    const created = this.profileRepository.create(profileData);
    const saved = await this.profileRepository.save(created);
    return this.formatProfileResponse(saved);
  }

  private summarizeEducation(education?: WizardProfileDto['education']): string | undefined {
    if (!education?.length) return undefined;
    return education
      .map((e) => [e.degree, e.institutionName].filter(Boolean).join(' - '))
      .filter(Boolean)
      .join('; ');
  }

  private buildEducationList(profile: ProfileEntity): Record<string, unknown>[] {
    if (profile.educationList?.length) return profile.educationList;
    const degree = profile.degreeName || profile.highestQualification || profile.qualificationOther;
    if (!degree && !profile.collegeUniversity && !profile.specialization) return [];
    return [
      {
        degree,
        qualification: profile.highestQualification || profile.qualificationOther,
        specialization: profile.specialization,
        institutionName: profile.collegeUniversity,
        endYear: profile.passingYear,
      },
    ];
  }

  private buildExperience(profile: ProfileEntity): Record<string, unknown> {
    const existing = (profile.experience || {}) as Record<string, unknown>;
    const hasFlat =
      profile.jobTitle ||
      profile.companyName ||
      profile.occupation ||
      profile.industry ||
      profile.annualIncome ||
      profile.currentlyWorking;

    if (!hasFlat && Object.keys(existing).length > 0) return existing;

    return {
      ...existing,
      currentlyWorking: profile.currentlyWorking,
      jobTitle: profile.jobTitle || profile.occupation || existing.jobTitle,
      companyName: profile.companyName || existing.companyName,
      industry: profile.industry || existing.industry,
      currentSalary: profile.annualIncome || profile.income || existing.currentSalary,
    };
  }

  private summarizeEducationFromFlat(profile: ProfileEntity): string | undefined {
    if (profile.education?.trim()) return profile.education;
    const parts = [profile.degreeName || profile.highestQualification, profile.collegeUniversity].filter(Boolean);
    return parts.length ? parts.join(' - ') : undefined;
  }

  private syncDerivedProfileFields(profile: ProfileEntity): void {
    profile.educationList = this.buildEducationList(profile);
    profile.experience = this.buildExperience(profile);
    const educationSummary = this.summarizeEducationFromFlat(profile);
    if (educationSummary) profile.education = educationSummary;
    if (!profile.occupation?.trim() && profile.jobTitle?.trim()) {
      profile.occupation = profile.jobTitle;
    }
    if (!profile.isVisible) profile.isVisible = true;
  }

  private formatProfileResponse(profile: ProfileEntity): ProfileEntity & { wizardProfile: Record<string, unknown> } {
    const galleryPhotos = Array.isArray(profile.photos)
      ? profile.photos
      : profile.photos
        ? [String(profile.photos)]
        : [];
    const mainPhoto = profile.profilePhoto || galleryPhotos[0] || null;

    const educationList = this.buildEducationList(profile);
    const experience = this.buildExperience(profile);
    const educationSummary = this.summarizeEducationFromFlat(profile);

    const wizardProfile = {
      personalDetails: {
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        phone: profile.phone,
        email: profile.email,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        address: profile.address,
        pincode: profile.pincode,
        height: profile.height,
        weight: profile.weight,
        bodyType: profile.bodyType,
        complexion: profile.complexion,
        bloodGroup: profile.bloodGroup,
        physicalStatus: profile.physicalStatus,
        disabilityDetails: profile.disabilityDetails,
        highestQualification: profile.highestQualification,
        qualificationOther: profile.qualificationOther,
        degreeName: profile.degreeName,
        specialization: profile.specialization,
        collegeUniversity: profile.collegeUniversity,
        passingYear: profile.passingYear,
        gradeCgpa: profile.gradeCgpa,
        currentlyWorking: profile.currentlyWorking,
        companyName: profile.companyName,
        jobTitle: profile.jobTitle,
        industry: profile.industry,
        annualIncome: profile.annualIncome,
        yearsOfExperience: profile.yearsOfExperience,
        workLocation: profile.workLocation,
        currentStatus: profile.currentStatus,
        currentStatusOther: profile.currentStatusOther,
        languagesKnown: profile.languagesKnown || [],
      },
      horoscope: {
        horoscopeAvailable: profile.horoscopeAvailable,
        rashi: profile.rashi,
        nakshatra: profile.nakshatra,
        gothram: profile.gothram,
        manglik: profile.manglik,
        horoscope: profile.horoscope || profile.zodiacSign,
        zodiacSign: profile.zodiacSign || profile.horoscope,
        timeOfBirth: profile.timeOfBirth,
        placeOfBirth: profile.placeOfBirth,
        horoscopeFileUrl: profile.horoscopeFileUrl,
      },
      religion: {
        religion: profile.religion,
        religionOther: profile.religionOther,
        caste: profile.caste,
        subCaste: profile.subCaste,
        motherTongue: profile.motherTongue,
        community: profile.community,
      },
      marital: {
        maritalStatus: profile.maritalStatus,
        yearsMarried: profile.yearsMarried,
        haveChildren: profile.haveChildren,
        numberOfChildren: profile.numberOfChildren,
        childrenBoys: profile.childrenBoys,
        childrenGirls: profile.childrenGirls,
        childrenLivingWith: profile.childrenLivingWith,
        readyForRemarriage: profile.readyForRemarriage,
      },
      family: {
        familyType: profile.familyType,
        familyStatus: profile.familyStatus,
        fatherName: profile.fatherName,
        fatherAlive: profile.fatherAlive,
        fatherOccupation: profile.fatherOccupation,
        motherName: profile.motherName,
        motherAlive: profile.motherAlive,
        motherOccupation: profile.motherOccupation,
        siblings: profile.siblings,
        siblingDetails: profile.siblingDetails || [],
      },
      partnerPreferences: {
        prefAgeMin: profile.prefAgeMin,
        prefAgeMax: profile.prefAgeMax,
        prefHeightMin: profile.prefHeightMin,
        prefHeightMax: profile.prefHeightMax,
        prefMaritalStatuses: profile.prefMaritalStatuses || [],
        prefReligions: profile.prefReligions || [],
        prefCastes: profile.prefCastes || [],
        prefCities: profile.prefCities || profile.prefLocations || [],
        prefFamilyType: profile.prefFamilyType,
      },
      lifestyle: {
        diet: profile.diet,
        drinking: profile.drinking,
        smoking: profile.smoking,
      },
      education: educationList,
      experience,
      hobbies: profile.interests || [],
      expressYourself: {
        ...(profile.expressYourself || {}),
        aboutMe: profile.expressYourself?.aboutMe || profile.bio,
      },
      profilePhoto: mainPhoto,
    };

    return Object.assign(profile, {
      profilePhoto: mainPhoto,
      photos: galleryPhotos,
      galleryVisibility: profile.galleryVisibility || 'matched_only',
      education: educationSummary || profile.education,
      occupation: profile.occupation || profile.jobTitle,
      subscriptionType: profile.subscriptionType || (profile.isPremium ? 'Premium' : 'Free'),
      isPremium: profile.isPremium || profile.subscriptionType !== 'Free',
      isBoosted: Boolean(
        profile.boostExpiresAt && new Date(profile.boostExpiresAt).getTime() > Date.now(),
      ),
      boostExpiresAt:
        profile.boostExpiresAt && new Date(profile.boostExpiresAt).getTime() > Date.now()
          ? profile.boostExpiresAt
          : null,
      wizardProfile,
    });
  }

  async searchProfiles(
    filters: Record<string, unknown>,
    page = 1,
    limit = 20,
    options?: { excludeUserIds?: string[] },
  ) {
    const qb = this.profileRepository
      .createQueryBuilder('p')
      .where('p.isVisible = :visible', { visible: true });

    if (options?.excludeUserIds?.length) {
      qb.andWhere('p.userId NOT IN (:...excludeUserIds)', { excludeUserIds: options.excludeUserIds });
    }

    if (filters.gender) qb.andWhere('p.gender = :gender', { gender: filters.gender });
    if (filters.religion) qb.andWhere('p.religion LIKE :religion', { religion: `%${filters.religion}%` });
    if (filters.caste) qb.andWhere('p.caste LIKE :caste', { caste: `%${filters.caste}%` });
    if (filters.subCaste) qb.andWhere('p.subCaste LIKE :subCaste', { subCaste: `%${filters.subCaste}%` });
    if (filters.city) qb.andWhere('p.city LIKE :city', { city: `%${filters.city}%` });
    if (filters.state) qb.andWhere('p.state LIKE :state', { state: `%${filters.state}%` });
    if (filters.country) qb.andWhere('p.country LIKE :country', { country: `%${filters.country}%` });
    if (filters.diet) qb.andWhere('p.diet = :diet', { diet: filters.diet });
    if (filters.maritalStatus) {
      qb.andWhere('p.maritalStatus = :maritalStatus', { maritalStatus: filters.maritalStatus });
    }
    if (filters.education) {
      qb.andWhere('p.education LIKE :education', { education: `%${filters.education}%` });
    }
    if (filters.occupation) {
      qb.andWhere('p.occupation LIKE :occupation', { occupation: `%${filters.occupation}%` });
    }
    if (filters.workingStatus === 'working') {
      qb.andWhere('(p.occupation IS NOT NULL AND p.occupation <> \'\')');
    }
    if (filters.workingStatus === 'not_working') {
      qb.andWhere('(p.currentStatus IS NOT NULL AND p.currentStatus <> \'\')');
    }
    if (filters.familyType) qb.andWhere('p.familyType = :familyType', { familyType: filters.familyType });
    if (filters.horoscopeAvailable === true || filters.horoscopeAvailable === 'true') {
      qb.andWhere('p.horoscopeAvailable = :horoscopeAvailable', { horoscopeAvailable: true });
    }
    if (filters.minHeight) qb.andWhere('p.height >= :minHeight', { minHeight: filters.minHeight });
    if (filters.maxHeight) qb.andWhere('p.height <= :maxHeight', { maxHeight: filters.maxHeight });

    if (filters.minAge || filters.maxAge) {
      qb.andWhere('p.dateOfBirth IS NOT NULL');
      if (filters.minAge) {
        qb.andWhere(
          `(CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', p.dateOfBirth) AS INTEGER)) >= :minAge`,
          { minAge: filters.minAge },
        );
      }
      if (filters.maxAge) {
        qb.andWhere(
          `(CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', p.dateOfBirth) AS INTEGER)) <= :maxAge`,
          { maxAge: filters.maxAge },
        );
      }
    }

    const skip = (page - 1) * limit;
    qb
      .orderBy(
        `CASE WHEN p.boostExpiresAt IS NOT NULL AND p.boostExpiresAt > datetime('now') THEN 0 ELSE 1 END`,
        'ASC',
      )
      .addOrderBy(
        `CASE p.subscriptionType WHEN 'Platinum' THEN 0 WHEN 'Premium' THEN 1 WHEN 'Basic' THEN 2 ELSE 3 END`,
        'ASC',
      )
      .addOrderBy('p.isPremium', 'DESC')
      .addOrderBy('p.updatedAt', 'DESC');

    const [profiles, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      profiles: profiles.map((p) => this.formatProfileResponse(p)),
      total,
    };
  }
}
