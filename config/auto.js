import cron from "node-cron";
import MangaModel from "../models/MangaModel.js";
import RequestModel from "../models/RequestModel.js";
import { requestType } from "../utils/request.js";
import axios from "axios";
import CommentModel from "../models/CommentModel.js";
import UserModel from "../models/UserModel.js";
import NotificationModel from "../models/NotificationModel.js";
import WarningModel from "../models/WarningModel.js";
import { broadcastMessage } from "../socket.js";

export const autoMonth = cron.schedule("0 0 1 * *", async () => {
  try {
    const mangaList = await MangaModel.find({});
    for (const manga of mangaList) {
      const totalViewInMonthNew = manga.totalViewInMonthNew;
      manga.totalViewInMonthOld = totalViewInMonthNew;
      await manga.save();
    }
    await MangaModel.updateMany(
      {},
      {
        $set: {
          totalViewInMonthNew: 0,
        },
      }
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const autoWeek = cron.schedule("0 0 * * 1", async () => {
  try {
    const mangaList = await MangaModel.find({});
    for (const manga of mangaList) {
      const totalViewInWeekNew = manga.totalViewInWeekNew;
      manga.totalViewInWeekOld = totalViewInWeekNew;
      await manga.save();
    }
    await MangaModel.updateMany(
      {},
      {
        $set: {
          totalViewInWeekNew: 0,
        },
      }
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const autoDay = cron.schedule("0 1 * * *", async () => {
  try {
    const mangaList = await MangaModel.find({});
    for (const manga of mangaList) {
      const totalViewInDayNew = manga.totalViewInDayNew;
      manga.totalViewInDayOld = totalViewInDayNew;
      await manga.save();
    }
    await MangaModel.updateMany(
      {},
      {
        $set: {
          totalViewInDayNew: 0,
        },
      }
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// export const autoToxicity = cron.schedule("*/10 * * * *", async () => {
//   const commentFromNodeJS = "This is a toxic comment from Node.js.";
//   const optionsPython = {
//     mode: "text",
//     pythonOptions: ["-u"], // unbuffered output
//     scriptPath: "../scripts/", // Đường dẫn đến tệp Python của bạn
//     args: [commentFromNodeJS], // Truyền dữ liệu như một đối số cho tệp Python
//   };
//   PythonShell.run(
//     "prediction_pipeline.py",
//     optionsPython,
//     function (err, resultFromPython) {
//       if (err) throw err;
//       console.log("Result from Python:", resultFromPython);
//     }
//   );
// });

export const autoToxicity = cron.schedule("*/30 * * * * *", async () => {
  try {
    const commentToxic = await RequestModel.find({
      typeRequest: requestType.Report,
      enable: 0,
    });
    if (commentToxic)
      commentToxic.forEach(async (element) => {
        // const request = await RequestModel.findById(element._id);
        const ids = element.content.split("-")[0];
        const commentId = ids.includes("/") ? ids.split("/")[0] : ids;
        const feedBackId = ids.includes("/") ? ids.split("/")[1] : "";
        const comment = await CommentModel.findById(commentId);
        const feedBack = await comment.feedBack.find(
          (feedBack) => feedBack._id.toString() === feedBackId
        );
        let comment_content =
          feedBackId == "" ? comment.commentContent : feedBack?.feedBackContent;

        try {
          const toxicityPredictions = await fetchData(comment_content);
          // console.log("Toxicity Predictions:", toxicityPredictions);
          // Handle toxicity predictions here
          const user = await UserModel.findById(element.userId);
          if (toxicityPredictions.level == 3) {
            const note = new NotificationModel({
              userId: user._id,
              content: toxicityPredictions.content,
            });
            await deleteCommentOrFeedBack(comment, feedBack, feedBackId == "");
            await createWarning(user);
            await note.save();
            broadcastMessage(user?._id.toString());
          } else if (toxicityPredictions.level > 0) {
            user.numberOfWarnings += toxicityPredictions.level;
            if (user.numberOfWarnings >= 3) {
              const note = new NotificationModel({
                userId: user._id,
                content:
                  "Tài khoản của bạn đã vi phạm quy tắc cộng động, tài khoản của bạn sẽ bị khóa trong vòng 30 ngày sau 1 tiếng kể từ nhận thông báo",
              });
              await deleteCommentOrFeedBack(
                comment,
                feedBack,
                feedBackId == ""
              );
              await createWarning(user);
              await note.save();
              broadcastMessage(user?._id.toString());
            } else {
              const note = new NotificationModel({
                userId: user._id,
                content:
                  "Bình luận gần đây của bạn không phù hợp quy tắc cộng đồng",
              });
              await deleteCommentOrFeedBack(
                comment,
                feedBack,
                feedBackId == ""
              );
              await note.save();
              await user.save();
              broadcastMessage(user?._id.toString());
            }
          } else {
            if (feedBackId == "")
              await CommentModel.updateOne(
                { _id: commentId },
                { isChecked: true },
                { new: true, upsert: true, timestamps: false }
              );
            else
              await CommentModel.updateOne(
                { _id: commentId, "feedBack._id": feedBackId },
                { "feedBack.$.isChecked": true },
                { new: true, upsert: true, timestamps: false }
              );
          }
          element.enable = 1;
          await element.save();
        } catch (error) {
          console.error("Error fetching toxicity predictions:", error);
        }
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const autoBan = cron.schedule("0 * * * * *", async () => {
  const today = new Date();
  try {
    const warningList = await WarningModel.find({
      enable: 1,
      unbanTime: { $ne: null },
    });
    if (warningList) {
      warningList.forEach(async (warning) => {
        const user = await UserModel.findById(warning.userId);
        if (warning.banTime != null) {
          if ((warning.banTime - today) / 36e5 <= 0) {
            user.enable = 0;
            warning.banTime = null;
          }
        } else {
          if ((warning.unbanTime - today) / 36e5 <= 0) {
            user.enable = 1;
            warning.unbanTime = null;
            warning.enable = 0;
          }
        }
        await user.save();
        await warning.save();
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export const autoCheckComment = cron.schedule("* * * * *", async () => {
  try {
    const commentList = await CommentModel.find({
      $or: [{ isChecked: false }, { "feedBack.isChecked": false }],
    });
    if (commentList) {
      commentList.forEach(async (comment) => {
        if (comment.feedBack.length > 0) {
          comment.feedBack.forEach(async (feedback) => {
            if (feedback.isChecked == false) {
              await checkFunc(
                comment,
                feedback,
                feedback.feedBackContent,
                false
              );
            }
          });
          if (comment.isChecked === false)
            await checkFunc(comment, null, comment.commentContent, true);
        } else {
          await checkFunc(comment, null, comment.commentContent, true);
        }
      });
      broadcastMessage("All");
    }
    // console.log(commentList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const fetchData = async (commentContent) => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/toxicity", {
      comment_content: commentContent,
    });
    return response.data;
  } catch (error) {
    console.error("Error calling Python API:", error.message);
    throw error;
  }
};

const createWarning = async (user) => {
  try {
    const warning = await WarningModel.findOne({
      userId: user._id,
    });
    warning.numberOfWarnings += 1;
    if (warning.numberOfWarnings <= 10) {
      const today = new Date();
      warning.enable = 1;
      warning.banTime = new Date(new Date().setHours(today.getHours() + 1));
      warning.unbanTime = new Date(new Date().setDate(today.getDate() + 30));
    }
    user.numberOfWarnings = 0;
    await user.save();
    await warning.save();
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteCommentOrFeedBack = async (comment, feedBack, check) => {
  if (check) {
    await comment.deleteOne();
  } else {
    await feedBack.deleteOne();
    await comment.save();
  }
};

const checkFunc = async (comment, feedback, contentCheck, check) => {
  const toxicityPredictions = await fetchData(contentCheck);
  const user = await UserModel.findById(
    feedback == null ? comment.userId : feedback?.userId
  );
  if (toxicityPredictions.level == 3) {
    const note = new NotificationModel({
      userId: user._id,
      content: toxicityPredictions.content,
    });
    await deleteCommentOrFeedBack(comment, feedback, check);
    await createWarning(user);
    await note.save();
  } else if (toxicityPredictions.level > 0) {
    user.numberOfWarnings += toxicityPredictions.level;
    if (user.numberOfWarnings >= 3) {
      const note = new NotificationModel({
        userId: user._id,
        content:
          "Tài khoản của bạn đã vi phạm quy tắc cộng động, tài khoản của bạn sẽ bị khóa trong vòng 30 ngày sau 1 tiếng kể từ nhận thông báo",
      });
      await deleteCommentOrFeedBack(comment, feedback, check);
      await createWarning(user);
      await note.save();
    } else {
      const note = new NotificationModel({
        userId: user._id,
        content: "Bình luận gần đây của bạn không phù hợp quy tắc cộng đồng",
      });
      await deleteCommentOrFeedBack(comment, feedback, check);
      await note.save();
      await user.save();
    }
  } else {
    if (check)
      await CommentModel.updateOne(
        { _id: comment._id.toString() },
        { isChecked: true },
        { new: true, upsert: true, timestamps: false }
      );
    else
      await CommentModel.updateOne(
        {
          _id: comment._id.toString(),
          "feedBack._id": feedback._id.toString(),
        },
        { "feedBack.$.isChecked": true },
        { new: true, upsert: true, timestamps: false }
      );
  }
};

// export const autoCover = cron.schedule("* * * * *", async () => {
//   try {
//     await axios.post("http://127.0.0.1:8000/cover", {});
//     // console.log("1111");
//   } catch (error) {
//     console.error("Error calling Python API:", error.message);
//     throw error;
//   }
// });

// export const test = cron.schedule("*/50 * * * * *", async () => {
//   try {
//     // console.log("111");
//     broadcastMessage("Done");
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
