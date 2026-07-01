import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender } from '../../../common/enums';
import { photosColumnTransformer } from '../photos-column.transformer';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ type: 'varchar', nullable: true })
  gender: Gender;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  religionOther: string;

  @Column({ nullable: true })
  caste: string;

  @Column({ nullable: true })
  motherTongue: string;

  @Column({ nullable: true })
  education: string;

  @Column({ nullable: true })
  highestQualification: string;

  @Column({ nullable: true })
  qualificationOther: string;

  @Column({ nullable: true })
  degreeName: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  collegeUniversity: string;

  @Column({ nullable: true })
  passingYear: string;

  @Column({ nullable: true })
  gradeCgpa: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ default: false })
  currentlyWorking: boolean;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  annualIncome: string;

  @Column({ nullable: true })
  yearsOfExperience: string;

  @Column({ nullable: true })
  workLocation: string;

  @Column({ nullable: true })
  currentStatus: string;

  @Column({ nullable: true })
  currentStatusOther: string;

  @Column({ nullable: true })
  income: string;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'simple-array', nullable: true })
  interests: string[];

  @Column({ type: 'text', nullable: true, transformer: photosColumnTransformer })
  photos: string[];

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'simple-json', nullable: true })
  languagesKnown: string[];

  @Column({ type: 'simple-json', nullable: true })
  educationList: Record<string, unknown>[];

  @Column({ type: 'simple-json', nullable: true })
  experience: Record<string, unknown>;

  @Column({ type: 'simple-json', nullable: true })
  expressYourself: Record<string, unknown>;

  @Column({ nullable: true })
  resumeUrl: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true })
  weight: string;

  @Column({ nullable: true })
  bodyType: string;

  @Column({ nullable: true })
  complexion: string;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  physicalStatus: string;

  @Column({ nullable: true })
  disabilityDetails: string;

  @Column({ default: false })
  horoscopeAvailable: boolean;

  @Column({ nullable: true })
  rashi: string;

  @Column({ nullable: true })
  nakshatra: string;

  @Column({ nullable: true })
  gothram: string;

  @Column({ nullable: true })
  zodiacSign: string;

  @Column({ nullable: true })
  timeOfBirth: string;

  @Column({ nullable: true })
  placeOfBirth: string;

  @Column({ nullable: true })
  horoscopeFileUrl: string;

  @Column({ nullable: true })
  subCaste: string;

  @Column({ nullable: true })
  community: string;

  @Column({ nullable: true })
  yearsMarried: string;

  @Column({ default: false })
  haveChildren: boolean;

  @Column({ nullable: true })
  childrenLivingWith: string;

  @Column({ type: 'int', nullable: true })
  numberOfChildren: number;

  @Column({ type: 'int', nullable: true })
  childrenBoys: number;

  @Column({ type: 'int', nullable: true })
  childrenGirls: number;

  @Column({ default: false })
  readyForRemarriage: boolean;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  familyValues: string;

  @Column({ nullable: true })
  fatherName: string;

  @Column({ default: true })
  fatherAlive: boolean;

  @Column({ nullable: true })
  motherName: string;

  @Column({ default: true })
  motherAlive: boolean;

  @Column({ type: 'int', nullable: true })
  brothers: number;

  @Column({ type: 'int', nullable: true })
  marriedBrothers: number;

  @Column({ type: 'int', nullable: true })
  sisters: number;

  @Column({ type: 'int', nullable: true })
  marriedSisters: number;

  @Column({ type: 'simple-array', nullable: true })
  prefMaritalStatuses: string[];

  @Column({ type: 'simple-array', nullable: true })
  prefCastes: string[];

  @Column({ nullable: true })
  prefFamilyType: string;

  @Column({ nullable: true })
  prefFamilyStatus: string;

  @Column({ type: 'simple-array', nullable: true })
  prefCities: string[];

  // Compatibility fields
  @Column({ nullable: true })
  maritalStatus: string; // never_married, divorced, widowed

  @Column({ nullable: true })
  diet: string; // vegetarian, non_vegetarian, vegan, eggetarian

  @Column({ nullable: true })
  smoking: string; // no, occasionally, yes

  @Column({ nullable: true })
  drinking: string; // no, occasionally, yes

  @Column({ nullable: true })
  horoscope: string; // sun sign

  @Column({ nullable: true })
  manglik: string; // yes, no, not_sure

  @Column({ nullable: true })
  familyType: string; // joint, nuclear

  @Column({ nullable: true })
  familyStatus: string; // middle_class, upper_middle, affluent

  @Column({ nullable: true })
  fatherOccupation: string;

  @Column({ nullable: true })
  motherOccupation: string;

  @Column({ type: 'int', nullable: true })
  siblings: number;

  @Column({ type: 'simple-json', nullable: true })
  siblingDetails: Record<string, unknown>[];

  // Partner preferences
  @Column({ type: 'int', nullable: true })
  prefAgeMin: number;

  @Column({ type: 'int', nullable: true })
  prefAgeMax: number;

  @Column({ type: 'float', nullable: true })
  prefHeightMin: number;

  @Column({ type: 'float', nullable: true })
  prefHeightMax: number;

  @Column({ type: 'simple-array', nullable: true })
  prefReligions: string[];

  @Column({ type: 'simple-array', nullable: true })
  prefLocations: string[];

  @Column({ type: 'simple-array', nullable: true })
  prefEducation: string[];

  @Column({ type: 'simple-array', nullable: true })
  prefDiet: string[];

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  isComplete: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: false })
  onlineStatus: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
