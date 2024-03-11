import mongoose from "mongoose";

const followingMangaSchema = mongoose.Schema(
  {
    // mangaName: { type: String, require: true },
    // mangaImage: { type: String, require: true },
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      require: true,
    },
    readChapter: { type: String, default: "" },
    readedChapter: { type: [String] },
  },
  { timestamps: true }
);

const CommentSchema = mongoose.Schema(
  {
    mangaName: { type: String, require: true },
    mangaImage: { type: String },
    comment: { type: String, require: true },
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manga",
      require: true,
    },
  },
  { timestamps: true }
);

const UserSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Làm ơn nhập họ tên"],
    },
    email: {
      type: String,
      required: [true, "Làm ơn nhập email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Làm ơn nhập mật khẩu"],
      minlength: [8, "Mật khẩu chứ ít nhất 8 ký tự"],
      validate: {
        validator: function (value) {
          // Regular expression to check for at least one number and one character
          return /^(?=.*\d)(?=.*[a-zA-Z]).{8,}$/.test(value);
        },
        message: "Mật khẩu phải chứa cả kí tự lẫn số",
      },
    },
    image: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      require: true,
    },
    followingManga: [followingMangaSchema],
    comment: [CommentSchema],
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("remove", async function (next) {
  try {
    const userId = this._id;

    // Xóa các tham chiếu đến userId trong CommentSchema và FeedBackSchema của MangaSchema
    await mongoose.model("Manga").updateMany(
      {
        $or: [
          { "chapter.comment.userId": userId },
          { "chapter.comment.feedBack.userId": userId },
        ],
      },
      {
        $pull: {
          "chapter.$.comment": { userId: userId },
          "chapter.$.comment.feedBack": { userId: userId },
        },
      }
    );

    // Cập nhật các trường transId và userId trong view của MangaSchema và ChapterSchema
    await mongoose
      .model("Manga")
      .updateMany(
        { "chapter.view.userId": userId },
        { $set: { "chapter.view.$.userId": null } }
      );
    await mongoose
      .model("Chapter")
      .updateMany(
        { "view.userId": userId },
        { $set: { "view.$.userId": null } }
      );

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("User", UserSchema);
