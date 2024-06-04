import mongoose from "mongoose";

const EmoListSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  emo: { type: String, require: true },
});

const FeedBackSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    // userName: { type: String, require: true },
    // userImage: { type: String },
    feedBackContent: { type: String, require: true },
    feedBackToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    // feedBackToName: { type: String, require: true },
    isChecked: { type: Boolean, default: false },
    emo: [EmoListSchema],
  },
  { timestamps: true }
);

const CommentSchema = mongoose.Schema(
  {
    commentContent: { type: String, require: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    // userName: { type: String, require: true },
    // userImage: { type: String },
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      require: true,
    },
    // mangaName: { type: String, require: true },
    // mangaImage: { type: String },
    chapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga.Chapter",
    },
    // chapName: { type: String },
    feedBack: [FeedBackSchema],
    isChecked: { type: Boolean, default: false },
    emo: [EmoListSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Comment", CommentSchema);
