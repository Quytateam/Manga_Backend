import mongoose from "mongoose";
import { requestType } from "../utils/request.js";

const RequestSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  typeRequest: { type: String, require: true, enum: requestType },
  content: { type: String, require: true },
  enable: { type: Number, require: true, default: 0 },
  createdAt: {
    type: Date,
    expires: 2592000,
    default: Date.now(),
  },
});

export default mongoose.model("Request", RequestSchema);
