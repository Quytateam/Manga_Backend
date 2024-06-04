import asyncHandler from "express-async-handler";
import MangaModel from "../models/MangaModel.js";
import UserModel from "../models/UserModel.js";
import BehaviorModel from "../models/BehaviorModel.js";
import CommentModel from "../models/CommentModel.js";
import HistoryModel from "../models/HistoryModel.js";

// ******** PRIVATE CONTROLLERS ***********
// @desc get detail manga
// @route GET /api/admin/mangainfo/:id
// @access Public
const getMangaInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(req.user._id);
    const match =
      user.isAdmin == true
        ? { _id: id }
        : {
            $and: [
              { _id: id },
              {
                $or: [
                  { memberJoin: { $elemMatch: { $eq: req.user._id } } },
                  { ownership: req.user._id },
                ],
              },
            ],
          };
    const manga = await MangaModel.findOne(match);
    // Nếu tìm thấy => gửi lên máy chủ
    if (!manga) sendError(res, "Can not found manga", 404);
    res.json(manga);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all manga
// @route GET /api/admin/managermanga
// @access Private
const getManagerManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const mangas = await MangaModel.find({
        ownership: req.user._id,
      }).sort({ nameOnUrl: 1 });
      res.json(mangas);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all manga
// @route GET /api/admin/joinup
// @access Private
const getManagerMangaForMember = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const mangas = await MangaModel.find({
        memberJoin: { $elemMatch: { $eq: req.user._id } },
      });
      res.json(mangas);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Create manga
// @route POST /api/admin/manga/create
// @access Private
const createManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Lấy dữ liệu phản hồi từ body
    const { name, janpanName, engName, author, desc, image, genre, status } =
      req.body;
    if (user) {
      const normalizedString = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
      // create a new manga
      const manga = new MangaModel({
        // ownership: [req.user._id],
        ownership: req.user._id,
        name,
        janpanName,
        engName,
        nameOnUrl: normalizedString
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        author,
        desc,
        image,
        genre,
        status: status == 0 ? 1 : 2,
        // year,
      });
      if (manga) {
        const existingManga = await MangaModel.findOne({ name });
        if (existingManga) throw new Error("Tên truyện này đã tồn tại");
        const createdManga = await manga.save();
        res.status(201).json(createdManga);
      } else {
        res.status(404);
        throw new Error("Dữ liệu truyện không hợp lệ");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update manga
// @route PUT /api/admin/manga/:id
// @access Private
const updateManga = asyncHandler(async (req, res) => {
  try {
    // Lấy dữ liệu phản hồi từ body
    const { name, janpanName, engName, author, desc, image, genre, status } =
      req.body;

    const manga = await MangaModel.findById(req.params.id);
    // Nếu tìm thấy => gửi lên máy chủ
    if (manga) {
      const normalizedString = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const nameOnUrl = normalizedString
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      // update manga data
      manga.name = name || manga.name;
      manga.janpanName = janpanName || manga.janpanName;
      manga.engName = engName || manga.engName;
      manga.nameOnUrl = nameOnUrl || manga.nameOnUrl;
      manga.author = author || manga.author;
      manga.desc = desc || manga.desc;
      manga.image = image || manga.image;
      manga.genre = genre || manga.genre;
      manga.status = (status == 0 ? 1 : 2) || manga.status;
      manga.enable = 0;

      const updatedManga = await manga.save();
      // Gửi phản hồi
      res.status(201).json(updatedManga);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy truyện");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update enable manga
// @route PATCH /api/admin/managermanga
// @access Private
const enableManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const manga = await MangaModel.findById(req.body.mangaId);
      manga.enable = !manga.enable;
      await manga.save();
      res.status(201).json("Cập nhật thành công");
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete manga
// @route DELETE /api/admin/managermanga
// @access Private/Admin
const deleteManga = asyncHandler(async (req, res) => {
  try {
    req.body.mangaId.forEach(async (id) => {
      const manga = await MangaModel.findById(id);
      if (manga) {
        deleteFromManga(id);
        await manga.deleteOne();
      }
      // else {
      //   res.status(404);
      //   throw new Error("Không tìm thấy truyện");
      // }
    });
    res.json({ message: "Truyện đã được xóa" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// const deleteManga = asyncHandler(async (req, res) => {
//   try {
//     const manga = await MangaModel.findById(req.body.mangaId);
//     if (manga) {
//       deleteFromManga(req.body.mangaId);
//       // await manga.deleteOne();
//       res.json({ message: "Truyện đã được xóa" });
//     } else {
//       res.status(404);
//       throw new Error("Không tìm thấy truyện");
//     }
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// @desc PUT all manga
// @route PUT /api/admin/addmember
// @access Private
const addMember = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const manga = await MangaModel.findById(req.body.mangaId);
      req.body.userId = req.body.userId.filter(
        (id) => id !== manga.ownership.toString()
      );
      manga.memberJoin = req.body.userId;
      await manga.save({ timestamps: false });
      res.json(manga);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc PUT all manga
// @route PUT /api/admin/transfer
// @access Private
const transferOfOwnership = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const manga = await MangaModel.findById(req.body.mangaId);
      manga.memberJoin = manga.memberJoin.filter(
        (id) => id.toString() !== req.body.userId.toString()
      );
      manga.ownership = req.body.userId;
      await manga.save({ timestamps: false });
      res.json(manga);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all manga
// @route GET /api/admin/managerchap/:id
// @access Private
const getManagerChapter = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const match =
        user.isAdmin == true
          ? { _id: req.params.id }
          : {
              $and: [
                { _id: req.params.id },
                {
                  $or: [
                    { memberJoin: { $elemMatch: { $eq: req.user._id } } },
                    { ownership: req.user._id },
                  ],
                },
              ],
            };
      // const manga = await MangaModel.findOne({
      //   _id: req.params.id,
      //   ownership: req.user._id,
      // });
      const manga = await MangaModel.findOne(match);
      if (!manga) throw new Error("Manga not found");
      const chapters = await manga.chapter.sort((a, b) =>
        b.chapName.localeCompare(a.chapName)
      );
      res.json({ chapters, mangaName: manga.name });
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all manga
// @route GET /api/admin/managerchap/:id/joinup
// @access Private
const getManagerChapterForMember = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const manga = await MangaModel.findOne({
        _id: req.params.id,
        memberJoin: { $elemMatch: { $eq: req.user._id } },
      });
      const chapters = await manga.chapter;
      res.json(chapters);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get detail chapter
// @route GET /api/admin/chapterinfo/:id
// @access Public
const getChapterInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await UserModel.findById(req.user._id);
    const match =
      user.isAdmin == true
        ? { _id: req.query.mangaId }
        : {
            $and: [
              { _id: req.query.mangaId },
              {
                $or: [
                  { memberJoin: { $elemMatch: { $eq: req.user._id } } },
                  { ownership: req.user._id },
                ],
              },
            ],
          };
    const manga = await MangaModel.findOne(match);
    // Nếu tìm thấy => gửi lên máy chủ
    if (!manga) sendError(res, "Can not found manga", 404);
    const chapterInfo = manga.chapter.find(
      (chapter) => chapter._id.toString() === id.toString()
    );
    res.json(chapterInfo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Create chapter
// @route POST /api/admin/createchap/:id
// @access Private
const createChapter = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user.id);
    const { id } = req.params;
    const { chapName, title, desc } = req.body;
    if (user) {
      // Option 1: mếu còn <img src=......./>
      // let regex = /<img[^>]+>/g;
      // let matches = image.match(regex);
      // let imgArray;
      // if (matches) {
      //   imgArray = matches.map((match) => match.trim());
      // }

      //Option 2: chỉ còn lại đường dẫn html
      var imgSrcList = desc.split("<img src='");
      // var imgSrcList1 = image.split('<img src="');
      imgSrcList = imgSrcList.slice(1);
      let imgArray = imgSrcList.map(function (imgSrc) {
        let endIndex = imgSrc.indexOf("'");
        // let endIndex1 = imgSrc.indexOf('"');
        let url = imgSrc.substring(0, endIndex);
        return url;
      });
      const chapter = {
        chapName,
        title,
        image: imgArray,
        postedUser: user._id,
        updatedAt: Date.now(),
      };

      if (chapter) {
        // Tìm và cập nhật Manga theo ID
        const manga = await MangaModel.findById(id);
        if (!manga) throw new Error("Manga not found");
        if (
          manga.ownership !== null &&
          manga.ownership.toString() !== req.user.id &&
          !manga.memberJoin.includes(req.user.id)
        )
          throw new Error("Không có đủ thẩm quyền");
        const existingChapter = manga.chapter.find(
          (chapter) => chapter.chapName === chapName
        );
        if (existingChapter) throw new Error("Chương truyện này đã tồn tại");
        manga.chapter.push(chapter);
        await manga.save();
        const createdChapter = manga.chapter.find(
          (chapter) => chapter.chapName === chapName
        );
        res.status(201).json(createdChapter);
      } else {
        res.status(404);
        throw new Error("Dữ liệu chap truyện không hợp lệ");
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update Chapter
// @route PUT /api/admin/updatechap/:id/:chapid
// @access Private
const updateChapter = asyncHandler(async (req, res) => {
  const { id, chapid } = req.params;
  try {
    // Lấy dữ liệu phản hồi từ body
    const { chapName, title, desc } = req.body;

    const manga = await MangaModel.findById(id);
    // Nếu tìm thấy => gửi lên máy chủ
    if (manga) {
      // let regex = /<img[^>]+>/g;
      // let matches = desc.match(regex);
      // let imgArray;
      // if (matches) {
      //   imgArray = matches.map((match) => match.trim());
      // }

      //Option 2
      var imgSrcList = desc.split("<img src='");
      // var imgSrcList1 = image.split('<img src="');
      imgSrcList = imgSrcList.slice(1);
      let imgArray = imgSrcList.map(function (imgSrc) {
        let endIndex = imgSrc.indexOf("'");
        // let endIndex1 = imgSrc.indexOf('"');
        let url = imgSrc.substring(0, endIndex);
        return url;
      });
      const chapter = manga.chapter.find(
        (chap) => chap._id.toString() === chapid.toString()
      );
      chapter.chapName = chapName || chapter.chapName;
      chapter.title = title || chapter.title;
      chapter.image = imgArray || chapter.image;
      chapter.enable = 0;
      chapter.updatedAt = Date.now();
      await manga.save();
      // Gửi phản hồi
      res.status(201).json(manga?._id);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy truyện");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Delete chapter
// @route DELETE /api/admin/managerchap/:id
// @access Private/Admin
const deleteChapter = asyncHandler(async (req, res) => {
  const { chapId } = req.body;
  try {
    const manga = await MangaModel.findById(req.params.id);
    if (manga) {
      chapId.forEach((id) => {
        deleteFromChapter(id);
        manga.chapter.pull(id);
      });
      // deleteFromChapter(chapId);
      // manga.chapter.pull(req.body.chapId);
      await manga.save();
      res.json(manga);
      // res.json(user);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy truyện");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Update Enable chapter
// @route PATCH /api/admin/managerchap/:id
// @access Private/Admin
const enableChapter = asyncHandler(async (req, res) => {
  try {
    const manga = await MangaModel.findById(req.params.id);
    if (manga) {
      const chap = await manga.chapter.find(
        (chap) => chap._id.toString() === req.body.chapId.toString()
      );
      chap.enable = !chap.enable;
      chap.updatedAt = Date.now();
      manga.numberOfChapters = chap.enable
        ? (manga.numberOfChapters += 1)
        : manga.numberOfChapters > 0
        ? manga.numberOfChapters - 1
        : 0;
      await manga.save();
      res.status(201).json("Cập nhật thành công");
    } else {
      res.status(404);
      throw new Error("Không tìm thấy truyện");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const deleteFromManga = async (mangaId) => {
  try {
    await UserModel.updateMany(
      { "followingManga._id": mangaId },
      { $pull: { followingManga: { _id: mangaId } } }
    );
    await UserModel.updateMany(
      { recommendList: mangaId },
      { $pull: { recommendList: mangaId } }
    );
    await BehaviorModel.updateMany(
      { "behaviorList.mangaId": mangaId },
      { $pull: { behaviorList: { mangaId: mangaId } } }
    );
    await CommentModel.deleteMany({ mangaId: mangaId });
    await HistoryModel.updateMany(
      { "historyList.mangaId": mangaId },
      { $pull: { historyList: { mangaId: mangaId } } }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteFromChapter = async (chapId) => {
  try {
    await UserModel.updateMany(
      { "followingManga.readedChapter": chapId },
      {
        $pull: {
          "followingManga.$.readedChapter": chapId, // Xóa chapterIdToDelete khỏi readedChapter trong mảng con
        },
      }
    );
    await UserModel.updateMany(
      { "followingManga.readChapter": chapId },
      { $set: { "followingManga.$.readChapter": null } }
    );
    await CommentModel.updateMany(
      { chapId: chapId },
      { $set: { chapId: null } }
    );
    await HistoryModel.updateMany(
      { "historyList.readChapter": chapId },
      { $set: { "historyList.$.readChapter": null } }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// ******** ADMIN CONTROLLERS ***********
// @desc Get all manga
// @route GET /api/admin/allmanga
// @access Private
const getAllManga = asyncHandler(async (req, res) => {
  try {
    //Tìm tk
    const user = await UserModel.findById(req.user._id);
    // Nếu tk tồn tại
    if (user) {
      const mangas = await MangaModel.find().sort({ nameOnUrl: 1 });
      res.json(mangas);
    } else {
      res.status(404);
      throw new Error("Không tìm thấy tài khoản");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc Get all user
// @route GET /api/admin/users
// @access Private
const getListUser = asyncHandler(async (req, res) => {
  try {
    // Tìm all tk in DB
    const users = await UserModel.find(
      {},
      {
        id: 1,
        fullName: 1,
        email: 1,
      }
    );

    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export {
  getMangaInfo,
  getManagerManga,
  getManagerMangaForMember,
  createManga,
  updateManga,
  enableManga,
  deleteManga,
  addMember,
  transferOfOwnership,
  getManagerChapter,
  getChapterInfo,
  createChapter,
  updateChapter,
  enableChapter,
  deleteChapter,
  getAllManga,
  getListUser,
};
