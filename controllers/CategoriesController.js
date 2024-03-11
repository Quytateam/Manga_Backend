import asyncHandler from "express-async-handler";
import Categories from "../models/CategoriesModel.js";
import MangaModel from "../models/MangaModel.js";

// ******** PUBLIC CONTROLLERS ***********
// @desc get all categories
// @route GET /api/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  try {
    // Tìm tất cả thể loại trong database
    const categories = await Categories.find({});
    // Gửi tất cả thể loại lên client
    res.json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc get manga by category
// @route GET /api/categories/:category
// @access Public
const getMangaByCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Categories.findOne({
      titleOnUrl: req.params.category,
    });
    // Tìm manga theo thể loại trong database
    const manga = await MangaModel.find({ category: category.title });
    // Nếu tìm thấy => gửi lên máy chủ
    if (manga) {
      const { status = "-1", sort = "0" } = req.query;
      if ((status === "-1" || status === "") && (sort === "0" || sort === "")) {
        res.json(manga);
      } else {
        const filterMangaByStatus = manga.filter(
          (item) => item.status == status
        );
        const dataChose =
          status === "-1" || status === "" ? manga : filterMangaByStatus;
        switch (sort) {
          case "15":
            // Lọc theo truyện mới nhất, lọc theo ngày tạo
            const sortNew = dataChose.sort((a, b) => b.createdAt - a.createdAt);
            res.json(sortNew);
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
            res.json(sortTopAll);
            break;
          case "11":
            // Lọc theo top tháng
            const sortMonth = dataChose.sort(
              (a, b) => b.totalViewInMonthOld - a.totalViewInMonthOld
            );
            res.json(sortMonth);
            break;
          case "12":
            // Lọc theo top tuần
            res.json(dataChose);
            break;
          case "13":
            // Lọc theo top ngày
            res.json("13");
            break;
          case "20":
            // Lọc theo theo dõi
            const sortFollow = dataChose.sort(
              (a, b) => b.numberOfFollows - a.numberOfFollows
            );
            res.json(sortFollow);
            break;
          case "25":
            // Lọc theo bình luận
            const sortComment = dataChose.sort(
              (a, b) => b.numberOfComments - a.numberOfComments
            );
            res.json(sortComment);
            break;
          case "30":
            // Lọc theo số chap
            const sortChap = dataChose.sort(
              (a, b) => b.numberOfChapters - a.numberOfChapters
            );
            res.json(sortChap);
            break;
          default:
            res.json(filterMangaByStatus);
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
// @route GET /api/categories/:category?status=1&short=15
// @access Public
// const queryFilterMiddleware = asyncHandler(async (req, res, next) => {
//   try {
//     const { status, sort } = req.query;
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// ******** ADMIN CONTROLLERS ***********
// @desc create new category
// @route POST /api/categories
// @access Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  try {
    // Lấy title từ request body
    const { title } = req.body;
    // Kiểm tra đã có thể loại này chưa
    const categoryExist = await Categories.find({ title: title });
    //categoryExist.title.includes(title)
    if (categoryExist.length > 0) {
      res.status(400);
      throw new Error("Đã có sẵn thể loại này");
    }

    const titleOnUrl = title.toLowerCase().replace(/\s+/g, "-");
    // Tạo mới thể loại
    // const category = await Categories({ title });
    const category = await Categories.create({ title, titleOnUrl });
    // Lưu thể loại vào db
    const createdCategory = await category.save();
    // Gửi tất cả thể loại lên client
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc update category
// @route PUT /api/categories/:id
// @access Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  try {
    // Lấy thể loại từ requeset params
    const category = await Categories.findById(req.params.id);
    if (category) {
      //Cập nhật thể loại
      category.title = req.body.title || category.title;
      category.titleOnUrl =
        req.body.title.toLowerCase().replace(/\s+/g, "-") ||
        category.titleOnUrl;
      // Lưu thể loại đã được cập nhật vào db
      const updatedCategory = await category.save();
      // Gửi thể loại đcược cập nhật lên client
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: "Không tìm thấy thể loại" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc delete category
// @route DELETE /api/categories/:id
// @access Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  try {
    // Lấy thể loại từ requeset params
    const category = await Categories.findById(req.params.id);
    if (category) {
      // Xoá thể loại trong db
      await category.deleteOne();
      // Gửi thông báo lên client
      res.json({ message: "Thể loại đã được xóa" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thể loại" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export {
  getCategories,
  getMangaByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
