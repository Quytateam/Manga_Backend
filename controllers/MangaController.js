import asyncHandler from "express-async-handler";
import Manga from "../models/MangaModel.js";
import bcrypt from "bcryptjs";
import { MangaData } from "../Data/MangaData.js";

// ******** PUBLIC CONTROLLERS ***********
// @desc import manga
// @route POST /api/manga/import
// @access Public
const importManga = asyncHandler(async (req, res) => {
  await Manga.deleteMany({});
  const mangaes = await Manga.insertMany(MangaData);
  res.status(201).json(mangaes);
});

// @desc get manga by id
// @route GET /api/manga/:id
// @access Public
const getMangaById = asyncHandler(async (req, res) => {
  try {
    // Tìm phim theo id trong database
    const manga = await Manga.findById(req.params.id);
    // Nếu tìm thấy => gửi lên máy chủ
    if (manga) {
      res.json(manga);
    }
    //Nếu không tìm thấy
    else {
      res.status(404);
      throw new Error("Không tìm thấy phim");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get all manga
// @route GET /api/manga
// @access Public
const getManga = asyncHandler(async (req, res) => {
  try {
    // Lọc phim theo thể loại, thời lượng , ngôn ngữ, tỉ lệ, năm
    const { category, time, language, rate, year, search } = req.query;
    let query = {
      ...(category && { category }),
      ...(time && { time }),
      ...(language && { language }),
      ...(rate && { rate }),
      ...(year && { year }),
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    // // load more movies functionallity (tải thêm chức năng phim)
    // const page = Number(req.query.pageNumber) || 1; // Nếu không có phim được cung cấp thì số trang là 1
    // const limit = 10; // Giới hạn số phim mỗi trang
    // const skip = (page - 1) * limit; // nhảy n phim mỗi trang

    // // find movie by query, skip and limit
    // const movies = await Movie.find(query)
    //   // .sort({ createAt: -1 })
    //   .skip(skip)
    //   .limit(limit);

    // // get total number of movie (lấy tổng số phim)
    // const count = await Movie.countDocuments(query);

    // // send response with movies and total number of movies (gửi phản hồi với phim và tổng số phim)
    // res.json({
    //   movies,
    //   page,
    //   pages: Math.ceil(count / limit),
    //   totalMovies: count,
    // });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { importManga, getMangaById };
