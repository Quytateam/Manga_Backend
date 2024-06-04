import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import { requestType } from "../utils/request.js";
import Request from "../models/RequestModel.js";
import CommentModel from "../models/CommentModel.js";

// ******** PRIAVTE CONTROLLERS ***********
// @desc import manga
// @route POST /api/request/create
// @access Private
const createRequest = asyncHandler(async (req, res) => {
  const { commentId, feedBackId, type, content } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      let requestNew = null;
      switch (type) {
        case requestType.Report:
          const comment = await CommentModel.findById(commentId);
          if (!comment) sendError(res, "Can not found comment", 404);
          const feedBack = await comment.feedBack.find(
            (feedBack) => feedBack._id.toString() === feedBackId.toString()
          );
          const contentRequest =
            feedBackId == null || feedBackId == ""
              ? commentId + "-" + content
              : commentId + "/" + feedBackId + "-" + content;
          requestNew = new Request({
            userId:
              feedBackId == null || feedBackId == ""
                ? comment.userId
                : feedBack.userId,
            typeRequest: type,
            content: contentRequest,
          });
          break;
        default:
          requestNew = new Request({
            userId: req.user._id,
            typeRequest: type,
            content: content,
          });
      }
      if (requestNew) {
        await requestNew.save();
        res.status(201).json(requestNew);
      } else {
        res.status(404);
        throw new Error("Dữ liệu không hợp lệ");
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { createRequest };
