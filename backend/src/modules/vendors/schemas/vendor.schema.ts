import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { VendorCategory } from '../../../common/enums';

@Schema({ timestamps: true })
export class Vendor extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  businessName: string;

  @Prop({ type: String, enum: VendorCategory, required: true })
  category: VendorCategory;

  @Prop()
  description: string;

  @Prop({ type: Object })
  location: {
    city: string;
    state: string;
    address: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  website: string;

  @Prop({ type: Object })
  pricing: {
    startingPrice: number;
    currency: string;
    priceType: string; // per_event, per_day, per_plate
  };

  @Prop([String])
  portfolio: string[];

  @Prop([String])
  services: string[];

  @Prop({ type: Object })
  rating: {
    average: number;
    count: number;
  };

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

@Schema({ timestamps: true })
export class VendorReview extends Document {
  @Prop({ required: true })
  vendorId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  review: string;

  @Prop([String])
  photos: string[];
}

export const VendorReviewSchema = SchemaFactory.createForClass(VendorReview);
