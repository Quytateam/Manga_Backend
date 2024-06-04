import asyncHandler from "express-async-handler";
import Genres from "../models/GenresModel.js";
import MangaModel from "../models/MangaModel.js";
import { GenreData } from "../Data/GenreData.js";
import { render } from "../utils/render.js";

// ******** PUBLIC CONTROLLERS ***********
// @desc get all genres
// @route GET /api/genres
// @access Public
const getGenres = asyncHandler(async (req, res) => {
  // console.log(req.query.filter);
  try {
    // Tìm tất cả thể loại trong database
    const genres = await Genres.find({}).sort({
      nameOnUrl: 1,
    });
    res.json(genres);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const getGenresNoExtend = asyncHandler(async (req, res) => {
  try {
    const genres = await Genres.find({ isExtend: false, enable: 1 }).sort({
      nameOnUrl: 1,
    });
    // Gửi tất cả thể loại lên client
    res.json(genres);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const getGenresExtend = asyncHandler(async (req, res) => {
  try {
    const genres = await Genres.find({ enable: 1 }).sort({ nameOnUrl: 1 });
    // Gửi tất cả thể loại lên client
    res.json(genres);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get manga by genre
// @route GET /api/genres/genre/:genre
// @access Public
const getMangaByGenre = asyncHandler(async (req, res) => {
  try {
    const genre = await Genres.findOne({
      nameOnUrl: req.params.genre,
    });
    const matchGenre = genre ? { genre: genre.name, enable: 1 } : { enable: 1 };
    // Tìm manga theo thể loại trong database
    // const manga = await MangaModel.find(
    //   { genre: genre.name },
    //   {
    //     name: 1,
    //     image: 1,
    //     numberOfViews: 1,
    //     numberOfFollows: 1,
    //     numberOfComments: 1,
    //     // "chapter.chapName": 1,
    //     // "chapter.updatedAt": 1,
    //   }
    // );
    const manga = await MangaModel.aggregate([
      { $match: matchGenre },
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
          totalViewInWeekOld: 1,
          totalViewInDayOld: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
    // Nếu tìm thấy => gửi lên máy chủ
    if (manga) {
      const oraginManga = manga.sort((a, b) => b.updatedAt - a.updatedAt);
      const { status = "-1", sort = "0", page } = req.query;
      if ((status === "-1" || status === "") && (sort === "0" || sort === "")) {
        // res.json(oraginManga);
        render(res, oraginManga, 36, page);
      } else {
        const filterMangaByStatus = oraginManga.filter(
          (item) => item.status == status
        );
        const dataChose =
          status === "-1" || status === "" ? oraginManga : filterMangaByStatus;
        switch (sort) {
          case "15":
            // Lọc theo truyện mới nhất, lọc theo ngày tạo
            const sortNew = dataChose.sort((a, b) => b.createdAt - a.createdAt);
            // res.json(sortNew);
            render(res, sortNew, 36, page);
            break;
          case "10":
            // Lọc theo top all
            dataChose.forEach((manga) => {
              manga.totalInteractions =
                manga.numberOfViews +
                manga.numberOfComments +
                manga.numberOfFollows;
            });
            const sortTopAll = dataChose.sort(
              (a, b) => b.totalInteractions - a.totalInteractions
            );
            // res.json(sortTopAll);
            render(res, sortTopAll, 36, page);
            break;
          case "11":
            // Lọc theo top tháng
            const sortMonth = dataChose.sort(
              (a, b) => b.totalViewInMonthOld - a.totalViewInMonthOld
            );
            // res.json(sortMonth);
            render(res, sortMonth, 36, page);
            break;
          case "12":
            // Lọc theo top tuần
            const sortWeek = dataChose.sort(
              (a, b) => b.totalViewInWeekOld - a.totalViewInWeekOld
            );
            render(res, sortWeek, 36, page);
            break;
          case "13":
            // Lọc theo top ngày
            const sortDay = dataChose.sort(
              (a, b) => b.totalViewInDayOld - a.totalViewInDayOld
            );
            render(res, sortDay, 36, page);
            break;
          case "20":
            // Lọc theo theo dõi
            const sortFollow = dataChose.sort(
              (a, b) => b.numberOfFollows - a.numberOfFollows
            );
            // res.json(sortFollow);
            render(res, sortFollow, 36, page);
            break;
          case "25":
            // Lọc theo bình luận
            const sortComment = dataChose.sort(
              (a, b) => b.numberOfComments - a.numberOfComments
            );
            // res.json(sortComment);
            render(res, sortComment, 36, page);
            break;
          case "30":
            // Lọc theo số chap
            const sortChap = dataChose.sort(
              (a, b) => b.numberOfChapters - a.numberOfChapters
            );
            // res.json(sortChap);
            render(res, sortChap, 36, page);
            break;
          default:
            // res.json(filterMangaByStatus);
            render(res, filterMangaByStatus, 36, page);
        }
        // if (sort === "" || sort === "0") {
        //   res.json(filterMangaByStatus);
        // } else {
        // }
      }
    }
    //Nếu không tìm thấy
    else {
      res.status(404);
      throw new Error("Không tìm thấy bộ manga nào");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get manga by sort
// @route GET /api/genes/:genre?status=1&short=15
// @access Public
// const queryFilterMiddleware = asyncHandler(async (req, res, next) => {
//   try {
//     const { status, sort } = req.query;
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// ******** ADMIN CONTROLLERS ***********
// @desc import genres
// @route POST /api/genres/import
// @access Public
const importGenre = asyncHandler(async (req, res) => {
  await Genres.deleteMany({});
  const genres = await Genres.insertMany(GenreData);
  res.status(201).json(genres);
});

// @desc create new genre
// @route POST /api/genres
// @access Private/Admin
const createGenre = asyncHandler(async (req, res) => {
  try {
    // Lấy name từ request body
    const { name, desc, isExtend } = req.body;
    // Kiểm tra đã có thể loại này chưa
    const genreExist = await Genres.find({ name: name });
    //genreExist.name.includes(name)
    if (genreExist.length > 0) {
      res.status(400);
      throw new Error("Đã có sẵn thể loại này");
    }
    const normalizedString = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const nameOnUrl = normalizedString
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    // Tạo mới thể loại
    // const genre = await Genres({ name });
    const genre = await Genres.create({
      name,
      desc,
      nameOnUrl,
      isExtend: isExtend === "Extend" ? true : false,
    });
    // Lưu thể loại vào db
    const createdGenre = await genre.save();
    // Gửi tất cả thể loại lên client
    res.status(201).json(createdGenre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc update genre
// @route PUT /api/genres/:id
// @access Private/Admin
const updateGenre = asyncHandler(async (req, res) => {
  try {
    // Lấy thể loại từ requeset params
    const genre = await Genres.findById(req.params.id);
    if (genre) {
      //Cập nhật thể loại
      genre.name = req.body.name || genre.name;
      genre.nameOnUrl =
        req.body.name.toLowerCase().replace(/\s+/g, "-") || genre.nameOnUrl;
      genre.desc = req.body.desc || genre.desc;
      genre.isExtend = req.body.isExtend === "Extend" ? true : false;
      genre.enable = 0;
      // Lưu thể loại đã được cập nhật vào db
      const updatedGenre = await genre.save();
      // Gửi thể loại đcược cập nhật lên client
      res.json(updatedGenre);
    } else {
      res.status(404).json({ message: "Không tìm thấy thể loại" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc delete genre
// @route DELETE /api/genres/:id
// @access Private/Admin
const deleteGenre = asyncHandler(async (req, res) => {
  try {
    // Lấy thể loại từ requeset params
    const genre = await Genres.findById(req.params.id);
    if (genre) {
      // Xoá thể loại trong db
      await genre.deleteOne();
      // Gửi thông báo lên client
      res.json({ message: "Thể loại đã được xóa" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thể loại" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc enable genre
// @route PATCH /api/genres/:id
// @access Private/Admin
const enableGenre = asyncHandler(async (req, res) => {
  try {
    // Lấy thể loại từ requeset params
    const genre = await Genres.findById(req.params.id);
    if (genre) {
      genre.enable = !genre.enable;
      await genre.save();
      res.json(genre);
    } else {
      res.status(404).json({ message: "Không tìm thấy thể loại" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// const updateMany = asyncHandler(async (req, res) => {
//   try {
//     // Lấy thể loại từ requeset params
//     const genre = await Genres.updateMany(
//       {},
//       {
//         $set: { enable: false },
//       }
//     );
//     res.json(genre);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

export {
  getGenres,
  getGenresNoExtend,
  getGenresExtend,
  getMangaByGenre,
  importGenre,
  createGenre,
  updateGenre,
  deleteGenre,
  enableGenre,
};
