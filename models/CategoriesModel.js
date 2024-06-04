import mongoose from "mongoose";

const CategoriesSchema = mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },
    titleOnUrl: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Categories", CategoriesSchema);
