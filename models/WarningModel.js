import mongoose from "mongoose";

const WarningSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  numberOfWarnings: { type: Number, require: true, default: 0 },
  enable: { type: Number, require: true, default: 0 },
  banTime: { type: Date, default: null },
  unbanTime: { type: Date, default: null },
});

export default mongoose.model("Warning", WarningSchema);
