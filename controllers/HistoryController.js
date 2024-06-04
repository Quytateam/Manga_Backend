import asyncHandler from "express-async-handler";
import UserModel from "../models/UserModel.js";
import MangaModel from "../models/MangaModel.js";
import History from "../models/HistoryModel.js";
import { render } from "../utils/render.js";

// ******** PRIVATE CONTROLLERS ***********

// @desc Get History
// @route GET /api/history
// @access Private
const getHistory = asyncHandler(async (req, res) => {
  const { page } = req.query;
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const history = await History.findOne({
        userId: req.user._id,
      });
      const historyList = [];
      if (history !== null) {
        const list = await history.historyList.sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        for (const e of list) {
          let history;
          let manga = await MangaModel.findOne({ _id: e.mangaId, enable: 1 });
          if (manga !== null) {
            let chapter = await manga.chapter.find(
              (chap) => chap._id.toString() === e.readChapter.toString()
            );
            history = {
              chapterIds: e.readChapter,
              chapterName: chapter.chapName,
              // chapterUrl:
              //   "/manga/" +
              //   manga.nameOnUrl +
              //   "/" +
              //   chapter.chapName +
              //   e.readChapter,
              _id: e.mangaId,
              image: manga.image,
              name: manga.name,
              nameOnUrl: manga.nameOnUrl,
              // url: "/manga/" + manga.nameOnUrl + "-" + manga._id,
            };
            historyList.push(history);
          }
        }
      }
      render(res, historyList, 36, page);
      // res.json(historyList);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Add History
// @route POST /api/history/:manganame/:chapname/:chapid
// @access Private
const addHistory = asyncHandler(async (req, res) => {
  const { manganame, chapid } = req.params;
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const history = await History.findOne({
        userId: user._id,
      });
      const manga = await MangaModel.findOne({
        nameOnUrl: manganame,
        // "chapter._id": chapid,
      });
      const existManga = user.followingManga.find(
        (r) => r._id.toString() === manga._id.toString()
      );
      const existHistory = history.historyList.find(
        (h) => h.mangaId.toString() === manga._id.toString()
      );
      const historyList = {
        mangaId: manga._id,
        readChapter: chapid,
      };
      if (existHistory) {
        existHistory.readChapter = chapid;
      } else {
        history.historyList.push(historyList);
      }
      if (existManga) {
        existManga.readChapter = chapid;
        if (!existManga.readedChapter.includes(chapid))
          existManga.readedChapter.push(chapid);
      }
      await history.save();
      await user.save();
      res.json({ existManga, history });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete History
// @route DELETE /api/history/:id
// @access Private
const deleteHistory = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const history = await History.findOne({
        userId: user._id,
      });
      if (history) {
        history.historyList.pull({ mangaId: req.params.id });
        await history.save();
        res.json({ message: "Đã xóa bộ truyện khỏi lịch sử" });
      }
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { getHistory, addHistory, deleteHistory };
