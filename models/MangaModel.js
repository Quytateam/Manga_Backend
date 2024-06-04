import mongoose from "mongoose";

const ChapterSchema = mongoose.Schema(
  {
    chapName: { type: String, require: true },
    title: { type: String, require: false, default: null },
    chapterView: {
      type: Number,
      require: true,
      default: 0,
    },
    image: { type: [String] },
    numberOfComments: {
      type: Number,
      require: true,
      default: 0,
    },
    postedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    enable: { type: Number, require: true, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const RatingListSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  rating: { type: Number, require: true },
});

const MangaSchema = mongoose.Schema(
  {
    memberJoin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    ownership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      require: true,
    },
    janpanName: {
      type: String,
      require: false,
    },
    engName: {
      type: String,
      require: false,
    },
    nameOnUrl: {
      type: String,
      require: false,
    },
    author: {
      type: String,
      require: false,
    },
    desc: {
      type: String,
      require: true,
    },
    image: {
      type: String,
      require: true,
    },
    genre: {
      type: [String],
      require: true,
    },
    // year: {
    //   type: Number,
    //   require: true,
    // },
    chapter: [ChapterSchema],
    numberOfChapters: {
      type: Number,
      require: true,
      default: 0,
    },
    rate: [RatingListSchema],
    numberOfComments: {
      type: Number,
      require: true,
      default: 0,
    },
    numberOfViews: {
      type: Number,
      require: true,
      default: 0,
    },
    follow: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfFollows: { type: Number, require: true, default: 0 },
    status: {
      type: Number,
      require: true,
      default: 1,
      enum: [0, 1, 2],
    },
    totalViewInMonthNew: {
      type: Number,
      require: true,
      default: 0,
    },
    totalViewInMonthOld: {
      type: Number,
      require: true,
      default: 0,
    },
    totalViewInWeekNew: {
      type: Number,
      require: true,
      default: 0,
    },
    totalViewInWeekOld: {
      type: Number,
      require: true,
      default: 0,
    },
    totalViewInDayNew: {
      type: Number,
      require: true,
      default: 0,
    },
    totalViewInDayOld: {
      type: Number,
      require: true,
      default: 0,
    },
    enable: { type: Number, require: true, default: 0, enum: [0, 1] },
  },
  { timestamps: true }
);

// MangaSchema.pre("save", function (next) {
//   this.numberOfChapters = this.chapter.length;
//   this.numberOfComments = this.comments.length;
//   this.numberOfViews = this.view.length;
//   this.numberOffollows = this.follow.length;
//   next();
// });

// ChapterSchema.pre("save", function (next) {
//   this.chapterView = this.view.length;
//   next();
// });

export default mongoose.model("Manga", MangaSchema);
