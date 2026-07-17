import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHeroBannerDocument extends Document {
  eyebrow: string;
  headline: string;
  discount: string;
  sub: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: string;
  bg: string;
  accentColor: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const heroBannerSchema = new Schema<IHeroBannerDocument>(
  {
    eyebrow:       { type: String, required: [true, "Eyebrow is required"], trim: true, maxlength: 100 },
    headline:      { type: String, required: [true, "Headline is required"], trim: true, maxlength: 200 },
    discount:      { type: String, trim: true, maxlength: 100, default: "" },
    sub:           { type: String, trim: true, maxlength: 500, default: "" },
    ctaLabel:      { type: String, trim: true, maxlength: 50, default: "SHOP NOW" },
    ctaHref:       { type: String, trim: true, default: "/shop" },
    secondaryLabel:{ type: String, trim: true, maxlength: 50, default: "" },
    secondaryHref: { type: String, trim: true, default: "/about" },
    image:         { type: String, default: "" },
    bg:            { type: String, default: "#f7f3ee" },
    accentColor:   { type: String, default: "#1a5c14" },
    order:         { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => { delete ret.__v; return ret; },
    },
  }
);

heroBannerSchema.index({ isActive: 1, order: 1 });

export const HeroBanner: Model<IHeroBannerDocument> =
  mongoose.models.HeroBanner ??
  mongoose.model<IHeroBannerDocument>("HeroBanner", heroBannerSchema);
