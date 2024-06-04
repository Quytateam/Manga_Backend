import asyncHandler from "express-async-handler";
import cron from "node-cron";
import UserModel from "../models/UserModel.js";
import Behavior from "../models/BehaviorModel.js";
import MangaModel from "../models/MangaModel.js";
import HistoryModel from "../models/HistoryModel.js";

let isCronActive = false;
const userCronJobs = new Map();

export const addBehavior = async (user, manganame, chapid = null) => {
  const mangaName = chapid
    ? manganame
    : manganame.substring(0, manganame.lastIndexOf("-"));
  try {
    const behavior = await Behavior.findOne({
      userId: user._id,
    });
    const manga = await MangaModel.findOne({
      nameOnUrl: mangaName,
      //   "chapter._id": chapid,
    });
    const existBehavior = behavior.behaviorList.find(
      (b) => b.mangaId.toString() === manga._id.toString()
    );
    if (existBehavior == null)
      behavior.behaviorList.push({ mangaId: manga._id });
    await behavior.save();
    //   res.json({ behavior });
    return [behavior, manga._id];
  } catch (error) {
    throw new Error(error.message);
  }
};

// ******** PRIVATE CONTROLLERS ***********

// @desc Auto Time Read
// @route POST /api/behavior/:manganame/:chapname/:chapid
// @access Private
const autoTimeRead = asyncHandler(async (req, res) => {
  const { manganame, chapid } = req.params;
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const [behavior, mangaId] = await addBehavior(user, manganame, chapid);
      if (behavior) {
        const behaviorItem = await behavior.behaviorList.find(
          (b) => b.mangaId.toString() === mangaId.toString()
        );
        const history = await HistoryModel.findOne({
          userId: user._id,
        });
        // const historyList = await history.historyList.sort(
        //   (a, b) => b.updatedAt - a.updatedAt
        // );
        // const compare =
        //   historyList.length === 0
        //     ? true
        //     : historyList[0]?.mangaId.toString() !== mangaId.toString()
        //     ? true
        //     : Math.floor((Date.now() - historyList[0]?.updatedAt) / 60000) > 30;
        // if (compare) {
        //   behaviorItem.readingFrequency += 1;
        //   if (historyList[0] != null) {
        //     historyList[0].updatedAt = new Date();
        //   }
        // }
        await history.save();
        behaviorItem.view += 1;
        const now = new Date();
        const createdAt = new Date(behaviorItem.createdAt);
        const diffTime = Math.abs(now - createdAt);
        const diffWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        behaviorItem.readingFrequency =
          diffWeek < 1 ? behaviorItem.view : behaviorItem.view / diffWeek;
        // const cornAction = cron.schedule("* * * * * *", async () => {
        //   if (!isCronActive) return cornAction.stop();
        //   behaviorItem.sumTimeRead += 1;
        //   await behavior.save();
        //   console.log("yes so");
        // });
        // Kiểm tra nếu cron job đã được khởi tạo cho người dùng này
        const cronAction = cron.schedule("*/2 * * * *", async () => {
          if (!userCronJobs.has(user._id.toString())) return cronAction.stop();
          behaviorItem.sumTimeRead += 1;
          await behavior.save();
          console.log("yes so");
        });
        userCronJobs.set(user._id.toString());
      }
      //   res.json(behavior);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const stopCronJob = async (req, res) => {
  // isCronActive = false;
  // res.status(200).json({ message: "Đã dừng thực thi cron job" });
  console.log("1111");
  const userId = req.user._id.toString();
  if (userCronJobs.has(userId)) {
    // Lấy cron job của người dùng và dừng nó
    // Xóa cron job khỏi userCronJobs
    userCronJobs.delete(userId);
    res.status(200).json({ message: "Đã dừng thực thi cron job" });
  }
};

export { autoTimeRead, stopCronJob };
