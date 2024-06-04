import mongoose from "mongoose";

const NotificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  content: { type: String, require: true },
  enable: { type: Number, require: true, default: 1 },
  createdAt: {
    type: Date,
    expires: 2592000,
    default: Date.now(),
  },
});

export default mongoose.model("Notification", NotificationSchema);
