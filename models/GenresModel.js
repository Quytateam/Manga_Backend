import mongoose from "mongoose";

const GenresSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    nameOnUrl: {
      type: String,
      require: true,
    },
    desc: {
      type: String,
      require: true,
      default: null,
    },
    isExtend: {
      type: Boolean,
      require: true,
      default: false,
    },
    enable: { type: Number, require: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Genres", GenresSchema);
