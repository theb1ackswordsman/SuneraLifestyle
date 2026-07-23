import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISearchKeyword extends Document {
  keyword: string;
  searchCount: number;
  clickCount: number;
  noResultsCount: number;
  isTrending: boolean;
  trendingOrder: number;
  lastSearchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const searchKeywordSchema = new Schema<ISearchKeyword>(
  {
    keyword: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    searchCount: { type: Number, default: 1 },
    clickCount: { type: Number, default: 0 },
    noResultsCount: { type: Number, default: 0 },
    isTrending: { type: Boolean, default: false },
    trendingOrder: { type: Number, default: 999 },
    lastSearchedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

searchKeywordSchema.index({ searchCount: -1 });
searchKeywordSchema.index({ isTrending: 1, trendingOrder: 1 });

export const SearchKeyword: Model<ISearchKeyword> =
  mongoose.models.SearchKeyword ??
  mongoose.model<ISearchKeyword>("SearchKeyword", searchKeywordSchema);
