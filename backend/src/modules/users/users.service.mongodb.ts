import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { WizardProfileDto } from './dto/wizard-profile.dto';
import { toPublicUrl } from './profile-upload.config';
import { UploadedFile } from './types/uploaded-file.type';
import { Gender } from '../../common/enums';

type ProfileRecord = Profile & Record<string, unknown>;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly maxProfilePhotos = 6;

  constructor(
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,
  ) {}

  async onModuleInit() {
    await this.repairCorruptedPhotos();
    await this.migrateProfilePhotoFields();
  }

  private toPlain(doc: ProfileDocument | ProfileRecord): ProfileRecord {
    if (doc && typeof (doc as ProfileDocument).toObject === 'function') {
      return (doc as ProfileDocument).toObject() as unknown as ProfileRecord;
    }
    return doc as ProfileRecord;
  }

  private async migrateProfilePhotoFields() {
    const profiles = await this.profileModel.find().exec();
    for (const doc of profiles) {
      const profile = this.toPlain(doc);
      const gallery = this.sanitizePhotos(profile.photos as string[] | undefined) || [];
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
        await this.profileModel.updateOne({ id: profile.id }, { $set: profile }).exec();
      }
    }
  }

  private async repairCorruptedPhotos() {
    const profiles = await this.profileModel
      .find({ photos: { $exists: true, $ne: null } })
      .exec();
    for (const doc of profiles) {
      const profile = this.toPlain(doc);
      const photos = profile.photos;
      if (!photos) continue;
      const arr = Array.isArray(photos) ? photos : [String(photos)];
      const corrupted = arr.some(
        (p) =>
          typeof p === 'string' &&
          (p.startsWith('data:') || (!p.startsWith('[') && !p.startsWith('/uploads'))),
      );
      if (corrupted) {
        await this.profileModel.updateOne({ id: profile.id }, { $set: { photos: [] } }).exec();
      }
    }
  }

  private sanitizePhotos(photos?: string[] | null): string[] | undefined {
    if (!photos?.length) return undefined;
    const cleaned = photos.filter((p) => typeof p === 'string' && p.length > 0 && !p.startsWith('data:'));
    return cleaned.length ? cleaned : undefined;
  }

  private countProfilePhotos(profile: ProfileRecord): number {
    const gallery = this.sanitizePhotos(profile.photos as string[] | undefined) || [];
    const galleryOnly = profile.profilePhoto
      ? gallery.filter((p) => p !== profile.profilePhoto)
      : gallery;
    return (profile.profilePhoto ? 1 : 0) + galleryOnly.length;
  }

  private assertCanAddProfilePhoto(profile: ProfileRecord): void {
    if (this.countProfilePhotos(profile) >= this.maxProfilePhotos) {
      throw new BadRequestException(
        `Maximum ${this.maxProfilePhotos} profile photos allowed. Remove a photo before uploading another.`,
      );
    }
  }

  async createProfile(userId: string, dto: CreateProfileDto): Promise<ProfileRecord> {
    const existing = await this.profileModel.findOne({ userId }).exec();
    if (existing) {
      return this.updateProfile(userId, dto);
    }

    const profile = await this.profileModel.create({
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
      siblingDetails: dto.siblingDetails || (dto.familyDetails?.siblingDetails as Record<string, unknown>[] | undefined),
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
    return this.formatProfileResponse(this.toPlain(profile));
  }

  async getProfileOrNull(userId: string): Promise<(ProfileRecord & { wizardProfile: Record<string, unknown> }) | null> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) return null;
    return this.formatProfileResponse(this.toPlain(profile));
  }

  async setPremiumStatus(userId: string, isPremium: boolean) {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);
    plain.isPremium = isPremium;
    if (!isPremium && plain.subscriptionType !== 'Free') {
      plain.subscriptionType = 'Free';
    } else if (isPremium && plain.subscriptionType === 'Free') {
      plain.subscriptionType = 'Premium';
    }
    await this.profileModel.updateOne({ userId }, { $set: plain }).exec();
    return this.formatProfileResponse(plain);
  }

  async setSubscription(userId: string, subscriptionType: string) {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);
    plain.subscriptionType = subscriptionType;
    plain.isPremium = subscriptionType !== 'Free';
    await this.profileModel.updateOne({ userId }, { $set: plain }).exec();
    return this.formatProfileResponse(plain);
  }

  async activateProfileBoost(userId: string, durationHours = 24) {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);
    const now = Date.now();
    const currentExpiry = plain.boostExpiresAt ? new Date(plain.boostExpiresAt as string | Date).getTime() : 0;
    const base = Math.max(now, currentExpiry);
    plain.boostExpiresAt = new Date(base + durationHours * 60 * 60 * 1000);
    await this.profileModel.updateOne({ userId }, { $set: plain }).exec();
    return this.formatProfileResponse(plain);
  }

  async clearExpiredBoost(userId: string) {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) return null;
    const plain = this.toPlain(profile);
    if (!plain.boostExpiresAt) return plain;
    if (new Date(plain.boostExpiresAt as string | Date).getTime() <= Date.now()) {
      plain.boostExpiresAt = null;
      await this.profileModel.updateOne({ userId }, { $set: { boostExpiresAt: null } }).exec();
    }
    return plain;
  }

  async updateProfilePhoto(
    userId: string,
    photoUrl: string,
  ): Promise<ProfileRecord & { wizardProfile: Record<string, unknown> }> {
    let profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) {
      profile = await this.profileModel.create({
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
      const plain = this.toPlain(profile);
      if (!plain.profilePhoto && this.countProfilePhotos(plain) >= this.maxProfilePhotos) {
        throw new BadRequestException(
          `Maximum ${this.maxProfilePhotos} profile photos allowed. Remove a photo before uploading another.`,
        );
      }
      plain.profilePhoto = photoUrl;
      await this.profileModel.updateOne({ userId }, { $set: { profilePhoto: photoUrl } }).exec();
      return this.formatProfileResponse(plain);
    }
    return this.formatProfileResponse(this.toPlain(profile));
  }

  async addGalleryPhoto(
    userId: string,
    photoUrl: string,
  ): Promise<ProfileRecord & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);

    this.assertCanAddProfilePhoto(plain);

    const current = this.sanitizePhotos(plain.photos as string[] | undefined) || [];
    if (current.includes(photoUrl) || plain.profilePhoto === photoUrl) {
      throw new BadRequestException('Photo already exists');
    }
    plain.photos = [...current, photoUrl];
    await this.profileModel.updateOne({ userId }, { $set: { photos: plain.photos } }).exec();
    return this.formatProfileResponse(plain);
  }

  async removeGalleryPhoto(
    userId: string,
    photoUrl: string,
  ): Promise<ProfileRecord & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);

    const current = this.sanitizePhotos(plain.photos as string[] | undefined) || [];
    const next = current.filter((p) => p !== photoUrl);
    if (next.length === current.length) {
      throw new NotFoundException('Photo not found in gallery');
    }
    plain.photos = next;
    await this.profileModel.updateOne({ userId }, { $set: { photos: next } }).exec();
    return this.formatProfileResponse(plain);
  }

  async setGalleryVisibility(
    userId: string,
    visibility: 'public' | 'matched_only',
  ): Promise<ProfileRecord & { wizardProfile: Record<string, unknown> }> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    const plain = this.toPlain(profile);
    plain.galleryVisibility = visibility;
    await this.profileModel.updateOne({ userId }, { $set: { galleryVisibility: visibility } }).exec();
    return this.formatProfileResponse(plain);
  }

  async getProfile(userId: string): Promise<ProfileRecord> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return this.formatProfileResponse(this.toPlain(profile));
  }

  async getProfileById(profileId: string): Promise<ProfileRecord> {
    const profile = await this.profileModel.findOne({ id: profileId }).exec();
    if (!profile) throw new NotFoundException('Profile not found');
    return this.formatProfileResponse(this.toPlain(profile));
  }

  async getProfileByIdOrUserId(idOrUserId: string): Promise<ProfileRecord> {
    const byId = await this.profileModel.findOne({ id: idOrUserId }).exec();
    if (byId) return this.formatProfileResponse(this.toPlain(byId));
    const byUser = await this.profileModel.findOne({ userId: idOrUserId }).exec();
    if (byUser) return this.formatProfileResponse(this.toPlain(byUser));
    throw new NotFoundException('Profile not found');
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileRecord> {
    const profile = await this.profileModel.findOne({ userId }).exec();
    if (!profile) {
      return this.createProfile(userId, {
        ...dto,
        firstName: dto.firstName || 'User',
        lastName: dto.lastName || 'Profile',
      });
    }

    const plain = this.toPlain(profile);

    if (dto.firstName !== undefined) plain.firstName = dto.firstName;
    if (dto.lastName !== undefined) plain.lastName = dto.lastName;
    if (dto.dateOfBirth !== undefined) plain.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) plain.gender = dto.gender;
    if (dto.religion !== undefined) plain.religion = dto.religion;
    if (dto.religionOther !== undefined) plain.religionOther = dto.religionOther;
    if (dto.caste !== undefined) plain.caste = dto.caste;
    if (dto.motherTongue !== undefined) plain.motherTongue = dto.motherTongue;
    if (dto.education !== undefined) plain.education = dto.education;
    if (dto.highestQualification !== undefined) plain.highestQualification = dto.highestQualification;
    if (dto.qualificationOther !== undefined) plain.qualificationOther = dto.qualificationOther;
    if (dto.degreeName !== undefined) plain.degreeName = dto.degreeName;
    if (dto.specialization !== undefined) plain.specialization = dto.specialization;
    if (dto.collegeUniversity !== undefined) plain.collegeUniversity = dto.collegeUniversity;
    if (dto.passingYear !== undefined) plain.passingYear = dto.passingYear;
    if (dto.gradeCgpa !== undefined) plain.gradeCgpa = dto.gradeCgpa;
    if (dto.occupation !== undefined) plain.occupation = dto.occupation;
    if (dto.currentlyWorking !== undefined) plain.currentlyWorking = dto.currentlyWorking;
    if (dto.companyName !== undefined) plain.companyName = dto.companyName;
    if (dto.jobTitle !== undefined) plain.jobTitle = dto.jobTitle;
    if (dto.industry !== undefined) plain.industry = dto.industry;
    if (dto.annualIncome !== undefined) plain.annualIncome = dto.annualIncome;
    if (dto.yearsOfExperience !== undefined) plain.yearsOfExperience = dto.yearsOfExperience;
    if (dto.workLocation !== undefined) plain.workLocation = dto.workLocation;
    if (dto.currentStatus !== undefined) plain.currentStatus = dto.currentStatus;
    if (dto.currentStatusOther !== undefined) plain.currentStatusOther = dto.currentStatusOther;
    if (dto.income !== undefined) plain.income = dto.income;
    if (dto.height !== undefined) plain.height = dto.height;
    if (dto.bio !== undefined) plain.bio = dto.bio;
    if (dto.interests !== undefined) plain.interests = dto.interests;
    if (dto.photos !== undefined) plain.photos = this.sanitizePhotos(dto.photos) ?? [];
    if (dto.middleName !== undefined) plain.middleName = dto.middleName;
    if (dto.displayName !== undefined) plain.displayName = dto.displayName;
    if (dto.phone !== undefined) plain.phone = dto.phone;
    if (dto.email !== undefined) plain.email = dto.email;
    if (dto.address !== undefined) plain.address = dto.address;
    if (dto.pincode !== undefined) plain.pincode = dto.pincode;
    if (dto.weight !== undefined) plain.weight = dto.weight;
    if (dto.bodyType !== undefined) plain.bodyType = dto.bodyType;
    if (dto.complexion !== undefined) plain.complexion = dto.complexion;
    if (dto.bloodGroup !== undefined) plain.bloodGroup = dto.bloodGroup;
    if (dto.physicalStatus !== undefined) plain.physicalStatus = dto.physicalStatus;
    if (dto.disabilityDetails !== undefined) plain.disabilityDetails = dto.disabilityDetails;
    if (dto.horoscopeAvailable !== undefined) plain.horoscopeAvailable = dto.horoscopeAvailable;
    if (dto.rashi !== undefined) plain.rashi = dto.rashi;
    if (dto.nakshatra !== undefined) plain.nakshatra = dto.nakshatra;
    if (dto.gothram !== undefined) plain.gothram = dto.gothram;
    if (dto.manglik !== undefined) plain.manglik = dto.manglik;
    if (dto.zodiacSign !== undefined) plain.zodiacSign = dto.zodiacSign;
    if (dto.horoscope !== undefined) {
      plain.horoscope = dto.horoscope;
      if (!dto.zodiacSign) plain.zodiacSign = dto.horoscope;
    }
    if (dto.siblings !== undefined) plain.siblings = dto.siblings;
    if (dto.country !== undefined) plain.country = dto.country;
    if (dto.state !== undefined) plain.state = dto.state;
    if (dto.city !== undefined) plain.city = dto.city;
    if (dto.timeOfBirth !== undefined) plain.timeOfBirth = dto.timeOfBirth;
    if (dto.placeOfBirth !== undefined) plain.placeOfBirth = dto.placeOfBirth;
    if (dto.horoscopeFileUrl !== undefined) plain.horoscopeFileUrl = dto.horoscopeFileUrl;
    if (dto.subCaste !== undefined) plain.subCaste = dto.subCaste;
    if (dto.community !== undefined) plain.community = dto.community;
    if (dto.maritalStatus !== undefined) plain.maritalStatus = dto.maritalStatus;
    if (dto.yearsMarried !== undefined) plain.yearsMarried = dto.yearsMarried;
    if (dto.haveChildren !== undefined) plain.haveChildren = dto.haveChildren;
    if (dto.childrenLivingWith !== undefined) plain.childrenLivingWith = dto.childrenLivingWith;
    if (dto.numberOfChildren !== undefined) plain.numberOfChildren = dto.numberOfChildren;
    if (dto.childrenBoys !== undefined) plain.childrenBoys = dto.childrenBoys;
    if (dto.childrenGirls !== undefined) plain.childrenGirls = dto.childrenGirls;
    if (dto.readyForRemarriage !== undefined) plain.readyForRemarriage = dto.readyForRemarriage;
    if (dto.familyType !== undefined) plain.familyType = dto.familyType;
    if (dto.familyValues !== undefined) plain.familyValues = dto.familyValues;
    if (dto.familyStatus !== undefined) plain.familyStatus = dto.familyStatus;
    if (dto.fatherName !== undefined) plain.fatherName = dto.fatherName;
    if (dto.fatherAlive !== undefined) plain.fatherAlive = dto.fatherAlive;
    if (dto.fatherOccupation !== undefined) plain.fatherOccupation = dto.fatherOccupation;
    if (dto.motherName !== undefined) plain.motherName = dto.motherName;
    if (dto.motherAlive !== undefined) plain.motherAlive = dto.motherAlive;
    if (dto.motherOccupation !== undefined) plain.motherOccupation = dto.motherOccupation;
    if (dto.brothers !== undefined) plain.brothers = dto.brothers;
    if (dto.marriedBrothers !== undefined) plain.marriedBrothers = dto.marriedBrothers;
    if (dto.sisters !== undefined) plain.sisters = dto.sisters;
    if (dto.marriedSisters !== undefined) plain.marriedSisters = dto.marriedSisters;
    if (dto.siblingDetails !== undefined) plain.siblingDetails = dto.siblingDetails;
    if (dto.familyDetails?.siblingDetails !== undefined) {
      plain.siblingDetails = dto.familyDetails.siblingDetails as Record<string, unknown>[];
    }
    if (dto.diet !== undefined) plain.diet = dto.diet;
    if (dto.drinking !== undefined) plain.drinking = dto.drinking;
    if (dto.smoking !== undefined) plain.smoking = dto.smoking;
    if (dto.prefAgeMin !== undefined) plain.prefAgeMin = dto.prefAgeMin;
    if (dto.prefAgeMax !== undefined) plain.prefAgeMax = dto.prefAgeMax;
    if (dto.prefHeightMin !== undefined) plain.prefHeightMin = dto.prefHeightMin;
    if (dto.prefHeightMax !== undefined) plain.prefHeightMax = dto.prefHeightMax;
    if (dto.prefMaritalStatuses !== undefined) plain.prefMaritalStatuses = dto.prefMaritalStatuses;
    if (dto.prefReligions !== undefined) plain.prefReligions = dto.prefReligions;
    if (dto.prefCastes !== undefined) plain.prefCastes = dto.prefCastes;
    if (dto.prefLocations !== undefined) plain.prefLocations = dto.prefLocations;
    if (dto.prefCities !== undefined) plain.prefCities = dto.prefCities;
    if (dto.prefFamilyType !== undefined) plain.prefFamilyType = dto.prefFamilyType;
    if (dto.prefFamilyStatus !== undefined) plain.prefFamilyStatus = dto.prefFamilyStatus;
    if (dto.location?.city !== undefined) plain.city = dto.location.city;
    if (dto.location?.state !== undefined) plain.state = dto.location.state;
    if (dto.location?.country !== undefined) plain.country = dto.location.country;
    if (dto.location?.pincode !== undefined) plain.pincode = dto.location.pincode;

    plain.isComplete = this.isProfileComplete(plain);
    this.syncDerivedProfileFields(plain);
    await this.profileModel.updateOne({ userId }, { $set: plain }).exec();
    return this.formatProfileResponse(plain);
  }

  private isProfileComplete(profile: ProfileRecord): boolean {
    return Boolean(
      (profile.firstName as string)?.trim() &&
        (profile.lastName as string)?.trim() &&
        profile.gender &&
        profile.dateOfBirth &&
        (profile.religion as string)?.trim() &&
        (profile.maritalStatus as string)?.trim() &&
        (profile.city as string)?.trim() &&
        (profile.state as string)?.trim() &&
        (profile.country as string)?.trim(),
    );
  }

  async saveWizardProfile(
    userId: string,
    dto: WizardProfileDto,
    files?: { profilePhoto?: UploadedFile; resume?: UploadedFile },
  ): Promise<ProfileRecord> {
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

    const existing = await this.profileModel.findOne({ userId }).exec();
    const existingPlain = existing ? this.toPlain(existing) : null;

    const photoUrl = files?.profilePhoto
      ? toPublicUrl(`profiles/${files.profilePhoto.filename}`)
      : dto.existingPhotoUrl || dto.profilePhotoUrl || existingPlain?.photos?.[0] || null;

    const resumeUrl = files?.resume
      ? toPublicUrl(`resumes/${files.resume.filename}`)
      : dto.experience?.resumeUrl || existingPlain?.resumeUrl || null;

    const experience = {
      ...(dto.experience || {}),
      resumeUrl: resumeUrl || undefined,
    };

    const profileData: Record<string, unknown> = {
      userId,
      firstName: pd.firstName.trim(),
      lastName: pd.lastName.trim(),
      displayName: pd.displayName?.trim() || `${pd.firstName} ${pd.lastName}`.trim(),
      dateOfBirth: pd.dateOfBirth,
      gender: pd.gender as Gender,
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
      photos: photoUrl ? [photoUrl] : existingPlain?.photos || [],
      resumeUrl: resumeUrl || undefined,
      education: this.summarizeEducation(dto.education),
      occupation: dto.experience?.currentlyWorking ? dto.experience.jobTitle : undefined,
      income: dto.experience?.currentlyWorking ? dto.experience.currentSalary : undefined,
      bio: dto.expressYourself?.aboutMe,
      isComplete: true,
    };

    if (existingPlain) {
      Object.assign(existingPlain, profileData);
      await this.profileModel.updateOne({ userId }, { $set: existingPlain }).exec();
      return this.formatProfileResponse(existingPlain);
    }

    const created = await this.profileModel.create(profileData);
    return this.formatProfileResponse(this.toPlain(created));
  }

  private summarizeEducation(education?: WizardProfileDto['education']): string | undefined {
    if (!education?.length) return undefined;
    return education
      .map((e) => [e.degree, e.institutionName].filter(Boolean).join(' - '))
      .filter(Boolean)
      .join('; ');
  }

  private buildEducationList(profile: ProfileRecord): Record<string, unknown>[] {
    const list = profile.educationList as Record<string, unknown>[] | undefined;
    if (list?.length) return list;
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

  private buildExperience(profile: ProfileRecord): Record<string, unknown> {
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

  private summarizeEducationFromFlat(profile: ProfileRecord): string | undefined {
    if ((profile.education as string)?.trim()) return profile.education as string;
    const parts = [profile.degreeName || profile.highestQualification, profile.collegeUniversity].filter(Boolean);
    return parts.length ? parts.join(' - ') : undefined;
  }

  private syncDerivedProfileFields(profile: ProfileRecord): void {
    profile.educationList = this.buildEducationList(profile);
    profile.experience = this.buildExperience(profile);
    const educationSummary = this.summarizeEducationFromFlat(profile);
    if (educationSummary) profile.education = educationSummary;
    if (!(profile.occupation as string)?.trim() && (profile.jobTitle as string)?.trim()) {
      profile.occupation = profile.jobTitle as string;
    }
    if (!profile.isVisible) profile.isVisible = true;
  }

  private formatProfileResponse(
    profile: ProfileRecord,
  ): ProfileRecord & { wizardProfile: Record<string, unknown> } {
    const galleryPhotos = Array.isArray(profile.photos)
      ? (profile.photos as string[])
      : profile.photos
        ? [String(profile.photos)]
        : [];
    const mainPhoto = profile.profilePhoto || galleryPhotos[0] || null;

    const educationList = this.buildEducationList(profile);
    const experience = this.buildExperience(profile);
    const educationSummary = this.summarizeEducationFromFlat(profile);
    const expressYourself = (profile.expressYourself || {}) as Record<string, unknown>;

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
        ...expressYourself,
        aboutMe: expressYourself.aboutMe || profile.bio,
      },
      profilePhoto: mainPhoto,
    };

    const boostExpiresAt = profile.boostExpiresAt as Date | string | null | undefined;
    const isBoosted = Boolean(boostExpiresAt && new Date(boostExpiresAt).getTime() > Date.now());

    return Object.assign(profile, {
      profilePhoto: mainPhoto,
      photos: galleryPhotos,
      galleryVisibility: profile.galleryVisibility || 'matched_only',
      education: educationSummary || profile.education,
      occupation: profile.occupation || profile.jobTitle,
      subscriptionType: profile.subscriptionType || (profile.isPremium ? 'Premium' : 'Free'),
      isPremium: profile.isPremium || profile.subscriptionType !== 'Free',
      isBoosted,
      boostExpiresAt: isBoosted ? boostExpiresAt : null,
      isComplete: Boolean(profile.isComplete),
      profileCompleted: Boolean(profile.isComplete),
      wizardProfile,
    }) as ProfileRecord & { wizardProfile: Record<string, unknown> };
  }

  private birthYearFromDateOfBirth(dateOfBirth: unknown): number | null {
    if (!dateOfBirth) return null;
    if (dateOfBirth instanceof Date) return dateOfBirth.getFullYear();
    const str = String(dateOfBirth);
    const year = parseInt(str.slice(0, 4), 10);
    return Number.isFinite(year) ? year : null;
  }

  private subscriptionPriority(subscriptionType: unknown): number {
    switch (subscriptionType) {
      case 'Platinum':
        return 0;
      case 'Premium':
        return 1;
      case 'Basic':
        return 2;
      default:
        return 3;
    }
  }

  async searchProfiles(
    filters: Record<string, unknown>,
    page = 1,
    limit = 20,
    options?: { excludeUserIds?: string[] },
  ) {
    const query: Record<string, unknown> = {
      isVisible: true,
      isComplete: true,
    };

    if (options?.excludeUserIds?.length) {
      query.userId = { $nin: options.excludeUserIds };
    }
    if (filters.gender) query.gender = filters.gender;
    if (filters.religion) query.religion = { $regex: filters.religion, $options: 'i' };
    if (filters.caste) query.caste = { $regex: filters.caste, $options: 'i' };
    if (filters.subCaste) query.subCaste = { $regex: filters.subCaste, $options: 'i' };
    if (filters.city) query.city = { $regex: filters.city, $options: 'i' };
    if (filters.state) query.state = { $regex: filters.state, $options: 'i' };
    if (filters.country) query.country = { $regex: filters.country, $options: 'i' };
    if (filters.diet) query.diet = filters.diet;
    if (filters.maritalStatus) query.maritalStatus = filters.maritalStatus;
    if (filters.education) query.education = { $regex: filters.education, $options: 'i' };
    if (filters.occupation) query.occupation = { $regex: filters.occupation, $options: 'i' };
    if (filters.workingStatus === 'working') {
      query.occupation = { $exists: true, $nin: [null, ''] };
    }
    if (filters.workingStatus === 'not_working') {
      query.currentStatus = { $exists: true, $nin: [null, ''] };
    }
    if (filters.familyType) query.familyType = filters.familyType;
    if (filters.horoscopeAvailable === true || filters.horoscopeAvailable === 'true') {
      query.horoscopeAvailable = true;
    }
    if (filters.minHeight) query.height = { ...(query.height as object), $gte: filters.minHeight };
    if (filters.maxHeight) query.height = { ...(query.height as object), $lte: filters.maxHeight };

    const currentYear = new Date().getFullYear();
    const minAge = filters.minAge ? Number(filters.minAge) : null;
    const maxAge = filters.maxAge ? Number(filters.maxAge) : null;

    let candidates = await this.profileModel.find(query).exec();
    const plainCandidates = candidates.map((c) => this.toPlain(c));

    let filtered = plainCandidates;
    if (minAge || maxAge) {
      filtered = filtered.filter((p) => {
        const birthYear = this.birthYearFromDateOfBirth(p.dateOfBirth);
        if (birthYear === null) return false;
        const age = currentYear - birthYear;
        if (minAge !== null && age < minAge) return false;
        if (maxAge !== null && age > maxAge) return false;
        return true;
      });
    }

    const now = Date.now();
    filtered.sort((a, b) => {
      const aBoost =
        a.boostExpiresAt && new Date(a.boostExpiresAt as string | Date).getTime() > now ? 0 : 1;
      const bBoost =
        b.boostExpiresAt && new Date(b.boostExpiresAt as string | Date).getTime() > now ? 0 : 1;
      if (aBoost !== bBoost) return aBoost - bBoost;

      const aSub = this.subscriptionPriority(a.subscriptionType);
      const bSub = this.subscriptionPriority(b.subscriptionType);
      if (aSub !== bSub) return aSub - bSub;

      const aPrem = a.isPremium ? 1 : 0;
      const bPrem = b.isPremium ? 1 : 0;
      if (aPrem !== bPrem) return bPrem - aPrem;

      const aUpdated = a.updatedAt ? new Date(a.updatedAt as string | Date).getTime() : 0;
      const bUpdated = b.updatedAt ? new Date(b.updatedAt as string | Date).getTime() : 0;
      return bUpdated - aUpdated;
    });

    const skip = (page - 1) * limit;
    const pageProfiles = filtered.slice(skip, skip + limit);

    return {
      profiles: pageProfiles.map((p) => this.formatProfileResponse(p)),
      total: filtered.length,
    };
  }
}
