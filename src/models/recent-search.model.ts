import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRecentSearch extends Document {
  userId: mongoose.Types.ObjectId;
  queries: Array<{ q: string; searchedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const recentSearchSchema = new Schema<IRecentSearch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    queries: [
      {
        q: { type: String, required: true, maxlength: 100 },
        searchedAt: { type: Date, required: true, default: () => new Date() },
        _id: false,
      },
    ],
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

export const RecentSearch: Model<IRecentSearch> =
  mongoose.models.RecentSearch ??
  mongoose.model<IRecentSearch>("RecentSearch", recentSearchSchema);
