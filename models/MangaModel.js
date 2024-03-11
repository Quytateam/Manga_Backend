import mongoose from "mongoose";

const FeedBackSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    userName: { type: String, require: true },
    userImage: { type: String },
    feedBackContent: { type: String, require: true },
    feedBackToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    feedBackToName: { type: String, require: true },
  },
  { timestamps: true }
);

const CommentSchema = mongoose.Schema(
  {
    userName: { type: String, require: true },
    userImage: { type: String },
    comment: { type: String, require: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    feedBack: [FeedBackSchema],
  },
  { timestamps: true }
);

const ChapterSchema = mongoose.Schema(
  {
    chapNumber: { type: String, require: true },
    title: { type: String, require: false },
    chapterView: {
      type: Number,
      require: true,
      default: 0,
    },
    // view: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    image: { type: [String] },
    comment: [CommentSchema],
  },
  { timestamps: true }
);

const MangaSchema = mongoose.Schema(
  {
    transId: {
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
    category: {
      type: [String],
      require: true,
    },
    year: {
      type: Number,
      require: true,
    },
    chapter: [ChapterSchema],
    numberOfChapters: {
      type: Number,
      require: true,
      default: 0,
    },
    rate: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          require: true,
        },
        rating: { type: Number, require: true },
      },
    ],
    comments: [CommentSchema],
    numberOfComments: {
      type: Number,
      require: true,
      default: 0,
    },
    // view: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
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
