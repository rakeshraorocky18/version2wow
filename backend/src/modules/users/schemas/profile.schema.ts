import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Gender } from '../../../common/enums';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true, strict: false, collection: 'profiles' })
export class Profile {
  @Prop({ type: String, default: () => uuidv4(), unique: true, index: true })
  id: string;

  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  dateOfBirth: string;

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

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop()
  bio: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ default: false })
  isComplete: boolean;

  @Prop({ default: true })
  isVisible: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
