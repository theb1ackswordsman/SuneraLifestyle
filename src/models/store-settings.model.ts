import mongoose, { Document, Model, Schema } from "mongoose";

export interface IStoreSettings extends Document {
  storeName: string;
  tagline: string;
  description: string;
  storeUrl: string;
  contact: {
    email: string;
    phone: string;
    address: string;
    whatsapp: string;
  };
  social: {
    instagram: string;
    twitter: string;
    facebook: string;
    youtube: string;
  };
  shipping: {
    freeAbove: number;
    standardFee: number;
    expressFee: number;
    standardDays: string;
    expressDays: string;
  };
  policies: {
    returnDays: number;
    exchangeDays: number;
  };
  business: {
    gst: string;
    cin: string;
  };
}

const storeSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName:   { type: String, default: "SunEra Lifestyle" },
    tagline:     { type: String, default: "Way to Wellness" },
    description: { type: String, default: "" },
    storeUrl:    { type: String, default: "" },
    contact: {
      email:    { type: String, default: "" },
      phone:    { type: String, default: "" },
      address:  { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    social: {
      instagram: { type: String, default: "" },
      twitter:   { type: String, default: "" },
      facebook:  { type: String, default: "" },
      youtube:   { type: String, default: "" },
    },
    shipping: {
      freeAbove:    { type: Number, default: 999 },
      standardFee:  { type: Number, default: 99 },
      expressFee:   { type: Number, default: 199 },
      standardDays: { type: String, default: "5-7" },
      expressDays:  { type: String, default: "2-3" },
    },
    policies: {
      returnDays:   { type: Number, default: 7 },
      exchangeDays: { type: Number, default: 15 },
    },
    business: {
      gst: { type: String, default: "" },
      cin: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ??
  mongoose.model<IStoreSettings>("StoreSettings", storeSettingsSchema);
