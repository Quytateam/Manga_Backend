import asyncHandler from "express-async-handler";
import Manga from "../models/MangaModel.js";
import bcrypt from "bcryptjs";
import { MangaData } from "../Data/MangaData.js";
import { render } from "../utils/render.js";
import UserModel from "../models/UserModel.js";
import { Timestamp } from "firebase-admin/firestore";
import GenresModel from "../models/GenresModel.js";
import axios from "axios";
import { ObjectId } from "mongodb";

// ******** PUBLIC CONTROLLERS ***********
// @desc import manga
// @route POST /api/manga/import
// @access Public
const importManga = asyncHandler(async (req, res) => {
  await Manga.deleteMany({});
  const mangaes = await Manga.insertMany(MangaData);
  res.status(201).json(mangaes);
});

// @desc get all manga
// @route GET /api/manga
// @access Public
const getAllManga = asyncHandler(async (req, res) => {
  try {
    const { page } = req.query;
    const manga = await await Manga.aggregate([
      { $match: { enable: 1 } },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          totalViewInMonthOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);
    // if (manga) {
    //   const oraginManga = manga.sort((a, b) => b.updatedAt - a.updatedAt);
    //   const sortMonth = oraginManga
    //     .sort((a, b) => b.totalViewInMonthOld - a.totalViewInMonthOld)
    //     .slice(0, 10); // **
    //   const updatedSortMonth = sortMonth.map((manga) => {
    //     const mangaCopy = JSON.parse(JSON.stringify(manga));
    //     mangaCopy.chapter = [manga.chapter[0]];
    //     return mangaCopy;
    //   });
    //   render(res, oraginManga, 36, page, updatedSortMonth);
    // }
    render(res, manga, 36, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get hot manga
// @route GET /api/manga/hot
// @access Public
const getHotManga = asyncHandler(async (req, res) => {
  try {
    const { page } = req.query;
    const manga = await await Manga.aggregate([
      { $match: { enable: 1 } },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          totalViewInDayOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { totalViewInDayOld: -1, updatedAt: -1 } },
    ]);
    render(res, manga, 36, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get manga by top month
// @route GET /api/manga/top-month
// @access Public
const getMangaTopMonth = asyncHandler(async (req, res) => {
  try {
    // const { page } = req.params;
    const manga = await await Manga.aggregate([
      { $match: { enable: 1 } },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 0] },
                },
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfViews: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.title": 1,
          totalViewInMonthOld: 1,
          updatedAt: 1,
        },
      },
    ]);
    if (manga) {
      const oraginManga = manga.sort((a, b) => b.updatedAt - a.updatedAt);
      const sortMonth = oraginManga
        .sort((a, b) => b.totalViewInMonthOld - a.totalViewInMonthOld)
        .slice(0, 10);
      res.json(sortMonth);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get info manga or chapter
// @route GET /api/manga/detail/:manganame/:chapname/:chapid
// @access Public
const getMangaOrChapter = asyncHandler(async (req, res) => {
  const { manganame, chapid } = req.params;
  // const name = req.params.name.substring(0, req.params.name.lastIndexOf("-"));
  const mangaName = chapid
    ? manganame
    : manganame.substring(0, manganame.lastIndexOf("-"));
  try {
    const projection = chapid
      ? {
          _id: 1,
          name: 1,
          nameOnUrl: 1,
          // follow: 1,
          // updatedAt: 1,
          numberOfViews: 1,
          totalViewInMonthNew: 1,
          totalViewInDayNew: 1,
          totalViewInWeekNew: 1,
          chapter: 1,
        }
      : {
          memberJoin: 0,
          ownership: 0,
          numberOfChapters: 0,
          totalViewInMonthNew: 0,
          totalViewInMonthOld: 0,
          totalViewInDayNew: 0,
          totalViewInDayOld: 0,
          totalViewInWeekNew: 0,
          totalViewInWeekOld: 0,
          createdAt: 0,
          "chapter.image": 0,
          "chapter.createdAt": 0,
          "chapter.comment": 0,
          "chapter.postedUser": 0,
          "chapter.numberOfComments": 0,
        };

    const manga = await Manga.findOne(
      { nameOnUrl: mangaName, enable: 1 },
      projection
    );
    // Nếu tìm thấy => gửi lên máy chủ
    if (!manga) sendError(res, "Can not found manga", 404);
    manga.chapter.sort((a, b) => b.chapName - a.chapName);
    if (chapid) {
      getChapter(res, manga, chapid);
    } else {
      getManga(res, manga);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get rating manga or chapter
// @route GET /api/manga/rating/:manganame
// @access Public
const getRatingManga = asyncHandler(async (req, res) => {
  const { manganame } = req.params;
  // const name = req.params.name.substring(0, req.params.name.lastIndexOf("-"));
  try {
    const mangaName = manganame.substring(0, manganame.lastIndexOf("-"));
    const manga = await Manga.findOne({ nameOnUrl: mangaName }, { rate: 1 });
    if (!manga) sendError(res, "Can not found manga", 404);
    res.json(manga);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const getManga = async (res, manga) => {
  const firstChapter =
    manga.chapter.length > 0
      ? {
          _id: manga.chapter[0]?._id,
          chapName: manga.chapter[0]?.chapName,
        }
      : { _id: null, chapName: null };
  const lastChapter =
    manga.chapter.length > 0
      ? {
          _id: manga.chapter[manga.chapter?.length - 1]?._id,
          chapName: manga.chapter[manga.chapter?.length - 1]?.chapName,
        }
      : { _id: null, chapName: null };
  res.json({ manga, firstChapter, lastChapter });
};

const getChapter = async (res, manga, chapid) => {
  try {
    // Tìm chỉ mục của chapid trong mảng chapter
    const chapter = manga.chapter.find(
      (chap) => chap._id.toString() === chapid.toString()
    );
    if (!chapter) sendError(res, "Can not found chapter", 404);
    const index = manga.chapter.findIndex(
      (chap) => chap._id.toString() === chapid.toString()
    );
    if (index === -1) sendError(res, "Chapter not found", 404);
    const nextChapter =
      index < manga.chapter.length - 1 ? manga.chapter[index + 1] : null;
    const prevChapter = index > 0 ? manga.chapter[index - 1] : null;
    const images = chapter.image;
    // console.log(manga.numberOfViews);
    // console.log(chapter.chapterView);
    manga.numberOfViews += 1;
    manga.totalViewInMonthNew += 1;
    manga.totalViewInWeekNew += 1;
    manga.totalViewInDayNew += 1;
    chapter.chapterView += 1;
    // console.log(manga.numberOfViews);
    // console.log(chapter.chapterView);
    await manga.save();
    res.json({ manga, prevChapter, nextChapter, chapter });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc sreach manga pro
// @route GET /api/search/pro
// @access Public
const getMangaPro = asyncHandler(async (req, res) => {
  try {
    let { genres = "", notgenres = "" } = req.query;
    const {
      gender = "-1",
      status = "-1",
      minchapter = "1",
      sort = "0",
      page = "",
    } = req.query;
    genres = genres ? await getGenreNamesByIds(genres) : [];
    notgenres = notgenres ? await getGenreNamesByIds(notgenres) : [];
    const matchGenres = genres.length === 0 ? {} : { genre: { $all: genres } };
    const matchNotGenres =
      notgenres.length === 0 ? {} : { genre: { $nin: notgenres } };
    const matchGender =
      gender == "-1" || gender == ""
        ? {}
        : gender == "1"
        ? { genre: { $in: ["Comedy", "Romance", "Ngôn tình"] } }
        : { genre: { $in: ["Action"] } };
    const matchStatus =
      status == "-1" || status == "" ? {} : { status: Number(status) };
    const matchMinChapter =
      minchapter == "1" || minchapter == ""
        ? { numberOfChapters: { $gte: 1 } }
        : { numberOfChapters: { $gte: Number(minchapter) } };
    const sortType = await sortTypes(Number(sort));
    const mangaList = await Manga.aggregate([
      {
        $addFields: {
          totalInteractions: {
            $sum: ["$numberOfViews", "$numberOfComments", "$numberOfFollows"],
          },
        },
      },
      {
        $match: { enable: 1 },
      },
      {
        $match: matchGenres,
      },
      {
        $match: matchNotGenres,
      },
      {
        $match: matchGender,
      },
      {
        $match: matchStatus,
      },
      {
        $match: matchMinChapter,
      },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              // { $sortArray: { input: "$chapter", sortBy: { chapName: -1 } } },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          totalViewInMonthOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          totalInteractions: 1,
        },
      },
      { $sort: sortType },
    ]);
    render(res, mangaList, 48, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc sreach manga by keyword
// @route GET /api/search/keyword
// @access Public
const getMangaByKeyWord = asyncHandler(async (req, res) => {
  try {
    const { keyword, page = "" } = req.query;
    const mangaList = await Manga.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { janpanName: { $regex: keyword, $options: "i" } },
            { engName: { $regex: keyword, $options: "i" } },
          ],
        },
      },
      {
        $match: { enable: 1 },
      },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              // { $sortArray: { input: "$chapter", sortBy: { chapName: -1 } } },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);
    render(res, mangaList, 36, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get recommend
// @route GET /api/manga/recommend"
// @access Public
const getRecommend = asyncHandler(async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (user) {
      const response = await axios.get("http://127.0.0.1:8000/recommend", {
        params: {
          userId: user._id,
        },
      });
      const recommendList = [];
      for (const e of response.data) {
        const mangaList = await Manga.aggregate([
          {
            $match: {
              _id: new ObjectId(e),
              enable: 1,
            },
          },
          {
            $set: {
              chapter: {
                $slice: [
                  {
                    $filter: {
                      input: {
                        $sortArray: {
                          input: "$chapter",
                          sortBy: { chapName: -1 },
                        },
                      },
                      as: "c",
                      cond: { $eq: ["$$c.enable", 1] },
                    },
                  },
                  3,
                ],
              },
            },
          },
          {
            $project: {
              name: 1,
              nameOnUrl: 1,
              image: 1,
              numberOfChapters: 1,
              numberOfViews: 1,
              numberOfFollows: 1,
              numberOfComments: 1,
              "chapter._id": 1,
              "chapter.chapName": 1,
              "chapter.updatedAt": 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ]);
        if (mangaList.length > 0) recommendList.push(mangaList[0]);
      }
      res.json(recommendList.slice(0, 36));
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get view day manga
// @route GET /api/manga/viewday
// @access Public
const getViewDayManga = asyncHandler(async (req, res) => {
  try {
    const { page } = req.query;
    const manga = await await Manga.aggregate([
      { $match: { enable: 1 } },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          totalViewInDayOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          totalViewInDayNew: -1,
          updatedAt: -1,
        },
      },
    ]);
    return res.json(manga.slice(0, 36));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get view week manga
// @route GET /api/manga/newweek
// @access Public
const getViewWeekManga = asyncHandler(async (req, res) => {
  try {
    const manga = await await Manga.aggregate([
      { $match: { enable: 1 } },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              1,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          totalViewInDayOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: {
          totalViewInWeekNew: -1,
          updatedAt: -1,
        },
      },
    ]);
    return res.json(manga.slice(0, 12));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc sreach manga gender
// @route GET /api/search/gender
// @access Public
const getMangaByGender = asyncHandler(async (req, res) => {
  try {
    // req.params;
    const { page = "" } = req.query;
    const matchGender =
      req.params.gender === "truyen-con-gai"
        ? { genre: { $in: ["Comedy", "Romance", "Ngôn tình"] } }
        : { genre: { $in: ["Action"] } };
    const mangaList = await Manga.aggregate([
      {
        $match: matchGender,
      },
      {
        $match: { enable: 1 },
      },
      {
        $set: {
          chapter: {
            $slice: [
              {
                $filter: {
                  input: {
                    $sortArray: {
                      input: "$chapter",
                      sortBy: { chapName: -1 },
                    },
                  },
                  as: "c",
                  cond: { $eq: ["$$c.enable", 1] },
                },
              },
              // { $sortArray: { input: "$chapter", sortBy: { chapName: -1 } } },
              3,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          nameOnUrl: 1,
          image: 1,
          numberOfChapters: 1,
          numberOfViews: 1,
          numberOfFollows: 1,
          numberOfComments: 1,
          "chapter._id": 1,
          "chapter.chapName": 1,
          "chapter.updatedAt": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);
    render(res, mangaList, 36, page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const getGenreNamesByIds = async (genreIds) => {
  try {
    // Chuyển chuỗi ID thành mảng các ID
    const idsArray = genreIds.split(",").map((id) => id.trim());
    // Truy vấn CSDL để lấy các thể loại tương ứng với ID
    const genres = await GenresModel.find({ _id: { $in: idsArray } });
    // Chuyển đổi kết quả thành mảng tên thể loại
    const genreNames = genres.map((genre) => genre.name);
    return genreNames;
  } catch (error) {
    throw new Error("Failed to fetch genre names");
  }
};

const sortTypes = async (sort) => {
  try {
    switch (sort) {
      case 15:
        return { createdAt: -1 };
      case 10:
        return { totalInteractions: -1, updatedAt: -1 };
      case 11:
        return { totalViewInMonthOld: -1, updatedAt: -1 };
      case 12:
        return { totalViewInWeekOld: -1, updatedAt: -1 };
      case 13:
        return { totalViewInDayOld: -1, updatedAt: -1 };
      case 20:
        return { numberOfFollows: -1, updatedAt: -1 };
      case 25:
        return { numberOfComments: -1, updatedAt: -1 };
      case 30:
        return { numberOfChapters: -1, updatedAt: -1 };
      default:
        return { updatedAt: -1 };
    }
  } catch (error) {
    throw new Error("Failed to fetch genre names");
  }
};

const convertData = asyncHandler(async (req, res) => {
  try {
    // const manga = await Manga.find({});
    // Lấy dữ liệu từ trường cũ
    // const mangas = await Manga.find();
    // // Thực hiện chuyển đổi dữ liệu
    // console.log("hello");
    // for (const manga of mangas) {
    //   // Chuyển đổi trường cũ thành trường mới
    //   manga.memberJoin = manga.memberJoin;

    //   // Lưu lại dữ liệu đã chuyển đổi
    //   await manga.save();
    // }

    // const result = await UserModel.updateMany({}, { $set: { image: null } });

    // console.log("Manga đã được lưu thành công.");

    // console.log("Dữ liệu đã được chuyển đổi thành công.");
    const docs = await Manga.find({}, "_id");
    const List = docs.map((doc) => doc._id.toString());
    res.json(List);
  } catch (error) {
    console.error("Lỗi khi chuyển đổi dữ liệu:", error);
  }
});

export {
  importManga,
  getAllManga,
  getHotManga,
  getRecommend,
  getViewDayManga,
  getViewWeekManga,
  getMangaTopMonth,
  getMangaOrChapter,
  getRatingManga,
  getMangaPro,
  getMangaByKeyWord,
  getMangaByGender,
  convertData,
};
