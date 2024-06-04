import mongoose from "mongoose";

const BehaviorListSchema = mongoose.Schema(
  {
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
    },
    rating: { type: Number, default: null },
    numOfComment: { type: Number, default: 0 },
    isFollow: {
      type: Boolean,
      default: false,
    },
    sumTimeRead: { type: Number, default: 0 },
    readingFrequency: { type: Number, default: 0 },
    view: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const BehaviorSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  behaviorList: [BehaviorListSchema],
});

export default mongoose.model("Behavior", BehaviorSchema);
