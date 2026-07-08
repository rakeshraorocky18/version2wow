import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Gender } from '../../../common/enums';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ type: String, enum: Gender })
  gender: Gender;

  @Prop()
  religion: string;

  @Prop()
  caste: string;

  @Prop()
  motherTongue: string;

  @Prop()
  education: string;

  @Prop()
  occupation: string;

  @Prop()
  income: string;

  @Prop()
  height: number;

  @Prop({ type: Object })
  location: {
    city: string;
    state: string;
    country: string;
    pincode: string;
  };

  @Prop({ type: Object })
  familyDetails: {
    fatherName: string;
    motherName: string;
    siblings: number;
    familyType: string;
    familyStatus: string;
  };

  @Prop([String])
  photos: string[];

  @Prop()
  bio: string;

  @Prop({ type: Object })
  preferences: {
    ageRange: { min: number; max: number };
    heightRange: { min: number; max: number };
    religions: string[];
    education: string[];
    locations: string[];
  };

  @Prop([String])
  interests: string[];

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ default: true })
  isVisible: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
