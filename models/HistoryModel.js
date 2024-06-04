import mongoose from "mongoose";

const HistoryListSchema = mongoose.Schema(
  {
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
    },
    readChapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga.Chapter",
    },
  },
  {
    timestamps: true,
  }
);

const HistorySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  historyList: [HistoryListSchema],
});

export default mongoose.model("History", HistorySchema);
