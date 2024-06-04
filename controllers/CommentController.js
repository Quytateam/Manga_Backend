import asyncHandler from "express-async-handler";
import Comment from "../models/CommentModel.js";
import bcrypt from "bcryptjs";
import UserModel from "../models/UserModel.js";
import MangaModel from "../models/MangaModel.js";
import { sendError } from "../utils/helper.js";
import { renderComment } from "../utils/render.js";
import { addBehavior } from "./BehaviorController.js";

// ******** PUBLIC CONTROLLERS ***********

// @desc GET New Comment
// @route GET /api/manga/comment/new
// @access Public
const getNewComment = asyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find(
      { chapId: { $ne: null } },
      {
        // mangaImage: 0,
        feedBack: 0,
      }
    )
      .sort({
        createdAt: -1,
      })
      .limit(25);
    res.json(comments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc GET Comment By Manga and Chapter
// @route GET /api/manga/comment/:manganame/:chapname/:chapid
// @access Public
const getComment = asyncHandler(async (req, res) => {
  const { manganame, chapid } = req.params;
  const { newlist, page } = req.query;
  const mangaName = chapid
    ? manganame
    : manganame.substring(0, manganame.lastIndexOf("-"));
  try {
    const manga = await MangaModel.findOne({ nameOnUrl: mangaName });
    const chapter =
      chapid != null
        ? manga.chapter.find(
            (chap) => chap._id.toString() === chapid.toString()
          )
        : null;
    const matchStage = {
      mangaId: manga._id,
    };
    if (chapter != null) {
      matchStage.chapId = chapter._id;
    }
    const sortComment =
      newlist == null || newlist == "" ? { createdAt: -1 } : { updatedAt: -1 };
    const comments = await Comment.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "users",
          localField: "feedBack.userId",
          foreignField: "_id",
          as: "fbUserDetail",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "feedBack.feedBackToId",
          foreignField: "_id",
          as: "mentionedUserDetail",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "mangas",
          localField: "mangaId",
          foreignField: "_id",
          as: "manga",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$manga",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          feedBack: {
            $map: {
              input: "$feedBack",
              as: "feedback",
              in: {
                _id: "$$feedback._id",
                userId: "$$feedback.userId",
                userName: {
                  $cond: {
                    if: { $in: ["$$feedback.userId", "$fbUserDetail._id"] },
                    then: {
                      $arrayElemAt: [
                        "$fbUserDetail.fullName",
                        {
                          $indexOfArray: [
                            "$fbUserDetail._id",
                            "$$feedback.userId",
                          ],
                        },
                      ],
                    },
                    else: "",
                  },
                },
                userImage: {
                  $cond: {
                    if: { $in: ["$$feedback.userId", "$fbUserDetail._id"] },
                    then: {
                      $arrayElemAt: [
                        "$fbUserDetail.image",
                        {
                          $indexOfArray: [
                            "$fbUserDetail._id",
                            "$$feedback.userId",
                          ],
                        },
                      ],
                    },
                    else: "",
                  },
                },
                feedBackContent: "$$feedback.feedBackContent",
                feedBackToId: "$$feedback.feedBackToId",
                feedBackToName: {
                  $cond: {
                    if: {
                      $in: [
                        "$$feedback.feedBackToId",
                        "$mentionedUserDetail._id",
                      ],
                    },
                    then: {
                      $arrayElemAt: [
                        "$mentionedUserDetail.fullName",
                        {
                          $indexOfArray: [
                            "$mentionedUserDetail._id",
                            "$$feedback.feedBackToId",
                          ],
                        },
                      ],
                    },
                    else: "",
                  },
                },
                _id: "$$feedback._id",
                emo: "$$feedback.emo",
                createdAt: "$$feedback.createdAt",
                updatedAt: "$$feedback.updatedAt",
              },
            },
          },
          userName: "$user.fullName",
          userImage: "$user.image",
          mangaName: "$manga.name",
          mangaImage: "$manga.image",
          chapName: {
            $cond: {
              if: { $eq: ["$chapId", null] },
              then: null,
              else: {
                $let: {
                  vars: {
                    matchedChapter: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$manga.chapter",
                            as: "chapter",
                            cond: { $eq: ["$$chapter._id", "$chapId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$matchedChapter.chapName",
                },
              },
            },
          },
        },
      },
      {
        $project: {
          user: 0,
          manga: 0,
          isChecked: 0,
          fbUserDetail: 0,
          mentionedUserDetail: 0,
        },
      },
      { $sort: sortComment },
    ]);
    renderComment(res, comments, 15, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ******** PRIVATE CONTROLLERS ***********

// @desc Create comment
// @route POST /api/manga/comment/:manganame/:chapname/:chapid
// @access Private
const createComment = asyncHandler(async (req, res) => {
  const { manganame, chapid } = req.params;
  const { commentContent } = req.body;
  const mangaName = chapid
    ? manganame
    : manganame.substring(0, manganame.lastIndexOf("-"));
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const [behavior, mangaId] = await addBehavior(user, manganame, chapid);
      const behaviorItem = await behavior.behaviorList.find(
        (b) => b.mangaId.toString() === mangaId.toString()
      );
      const manga = await MangaModel.findOne({ nameOnUrl: mangaName });
      if (!manga) sendError(res, "Can not found manga", 404);
      const chapter =
        chapid != null
          ? manga.chapter.find(
              (chap) => chap._id.toString() === chapid.toString()
            )
          : null;
      const comment = new Comment({
        commentContent: commentContent,
        userId: user._id,
        // userName: user.fullName,
        // userImage: user.image,
        mangaId: manga._id,
        // mangaName: manga.name,
        // mangaImage: manga.image,
        chapId: chapter ? chapter._id : null,
        // chapName: chapter ? chapter.chapName : "",
      });
      if (comment) {
        manga.numberOfComments += 1;
        if (chapter) chapter.numberOfComments += 1;
        behaviorItem.numOfComment += 1;
        const createdComment = await comment.save();
        await manga.save();
        await behavior.save();
        res.status(201).json(createdComment);
      } else {
        res.status(404);
        throw new Error("Dữ liệu bình luận không hợp lệ");
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update comment
// @route PUT /api/manga/comment/:id
// @access Private
const updateComment = asyncHandler(async (req, res) => {
  const { commentContent } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(req.params.id);
      if (!comment) sendError(res, "Can not found comment", 404);
      comment.commentContent = commentContent || comment.commentContent;
      comment.isChecked = false;
      const updateComment = await comment.save();
      res.status(201).json(updateComment);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete comment
// @route DELETE /api/manga/comment/:id
// @access Private
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(id);
      if (!comment) sendError(res, "Can not found comment", 404);
      const manga = await MangaModel.findById(comment.mangaId);
      const manganame = manga.nameOnUrl + "-" + manga._id.toString();
      const [behavior, mangaId] = await addBehavior(user, manganame);
      const behaviorItem = await behavior.behaviorList.find(
        (b) => b.mangaId.toString() === mangaId.toString()
      );
      const userComent = await UserModel.find(comment.userId);
      const chapter = comment.chapId
        ? manga.chapter.find(
            (chap) => String(chap._id) === String(comment.chapId)
          )
        : null;
      const check =
        user.isAdmin == true
          ? userComent.isAdmin == true
            ? false
            : true
          : comment.userId.equals(user._id);
      //   res.json(check);
      if (check) {
        manga.numberOfComments =
          manga.numberOfComments > 0 ? manga.numberOfComments - 1 : 0;
        if (chapter != null) {
          chapter.numberOfComments =
            chapter.numberOfComments > 0 ? chapter.numberOfComments - 1 : 0;
        }
        behaviorItem.numOfComment =
          behaviorItem.numOfComment > 0 ? behaviorItem.numOfComment - 1 : 0;
        await comment.deleteOne();
        await manga.save();
        await behavior.save();
        res.json({ message: "Bình luận đã được xóa" });
      } else {
        res.status(404);
        throw new Error("Bạn không đủ thẩm quyền");
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Emo comment
// @route PATCH /api/manga/emocomment/:id
// @access Private
const emoComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(id);
      if (!comment) sendError(res, "Can not found comment", 404);
      const existUser = await comment.emo.find(
        (r) => r._id.toString() === user._id.toString()
      );
      if (existUser) {
        if (existUser.emo === req.body.emo) {
          comment.emo.splice(existUser, 1);
        } else {
          existUser.emo = req.body.emo;
        }
      } else {
        const emo = {
          _id: user._id,
          emo: req.body.emo,
        };
        comment.emo.push(emo);
      }
      await comment.save({ timestamps: false });
      res.json(comment);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Create FeedBack
// @route POST /api/manga/feedback/:commentid/:feedbackid
// @access Private
const createFeedBack = asyncHandler(async (req, res) => {
  const { commentid, feedbackid } = req.params;
  const { feedBackContent } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(commentid);
      const feedback = await comment.feedBack.find(
        (fb) => fb._id.toString() === feedbackid
      );
      const id = feedback == null ? comment.userId : feedback.userId;
      const receiver = await UserModel.findById(id);
      if (!comment) sendError(res, "Can not found comment", 404);
      const feedBack = {
        userId: user._id,
        // userName: user.fullName,
        // userImage: user.image,
        feedBackContent: feedBackContent,
        feedBackToId: receiver._id,
        // feedBackToName: receiver.fullName,
      };
      comment.feedBack.push(feedBack);
      await comment.save();
      res.json(comment);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update feedBack
// @route PUT /api/manga/feedback/:id/:feedbackid
// @access Private
const updateFeedBack = asyncHandler(async (req, res) => {
  const { feedBackContent } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(req.params.id);
      if (!comment) sendError(res, "Can not found comment", 404);
      const feedBack = comment.feedBack.find(
        (feedback) =>
          feedback._id.toString() === req.params.feedbackid.toString()
      );
      feedBack.feedBackContent = feedBackContent || feedBack.feedBackContent;
      feedBack.isChecked = false;
      const updateComment = await comment.save();
      res.status(201).json(updateComment);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete FeedBack
// @route DELETE /api/manga/emofeedback
// @access Private
const deleteFeedBack = asyncHandler(async (req, res) => {
  const { commentId, feedBackId } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(commentId);
      if (!comment) sendError(res, "Can not found comment", 404);
      const feedBack = await comment.feedBack.find(
        (feedBack) => feedBack._id.toString() === feedBackId
      );
      const userComent = await UserModel.find(feedBack.userId);
      const check =
        user.isAdmin == true
          ? userComent.isAdmin == true
            ? false
            : true
          : feedBack.userId.equals(user._id);
      if (check) {
        await feedBack.deleteOne();
        await comment.save();
        res.json({ message: "Phản hồi đã được xóa" });
      } else {
        res.status(404);
        throw new Error("Bạn không đủ thẩm quyền");
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete FeedBack
// @route DELETE /api/manga/feedback
// @access Private
const emoFeedBack = asyncHandler(async (req, res) => {
  const { commentId, feedBackId } = req.body;
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const comment = await Comment.findById(commentId);
      if (!comment) sendError(res, "Can not found comment", 404);
      const feedBack = await comment.feedBack.find(
        (feedBack) => feedBack._id.toString() === feedBackId
      );
      const existUser = await feedBack.emo.find(
        (r) => r._id.toString() === user._id.toString()
      );
      if (existUser) {
        if (existUser.emo === req.body.emo) {
          feedBack.emo.splice(existUser, 1);
        } else {
          existUser.emo = req.body.emo;
        }
      } else {
        const emo = {
          _id: user._id,
          emo: req.body.emo,
        };
        feedBack.emo.push(emo);
      }
      await comment.save({ timestamps: false });
      res.json(comment);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export {
  getNewComment,
  getComment,
  createComment,
  updateComment,
  deleteComment,
  emoComment,
  createFeedBack,
  updateFeedBack,
  deleteFeedBack,
  emoFeedBack,
};
