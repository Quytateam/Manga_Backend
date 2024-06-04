import mongoose from "mongoose";
import passwordResetToken from "../models/PasswordResetToken.js";
import { sendError } from "../utils/helper.js";

const isValidPassResetToken = async (req, res, next) => {
  const { token, id } = req.query;
  if (!token.trim() || !mongoose.isValidObjectId(id))
    return sendError(res, "Invalid Request!");

  const resetToken = await passwordResetToken.findOne({ owner: id });
  if (!resetToken)
    return sendError(res, "Unauthorized access, Invalid Request!");

  const matched = await resetToken.compareToken(token);
  if (!matched) return sendError(res, "Unauthorized access, Invalid Request!");

  req.resetToken = resetToken;
  next();
};

export { isValidPassResetToken };
