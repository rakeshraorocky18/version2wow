import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender } from '../../../common/enums';

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
  caste: string;

  @Column({ nullable: true })
  motherTongue: string;

  @Column({ nullable: true })
  education: string;

  @Column({ nullable: true })
  occupation: string;

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

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
