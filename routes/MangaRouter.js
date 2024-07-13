import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import * as mangaController from "../controllers/MangaController.js";
import * as commentController from "../controllers/CommentController.js";
import * as userController from "../controllers/UserController.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.get("/", mangaController.getAllManga);
router.get("/hot", mangaController.getHotManga);
router.get("/viewday", mangaController.getViewDayManga);
router.get("/newweek", mangaController.getViewWeekManga);
router.get("/top-month", mangaController.getMangaTopMonth);
router.post("/import", mangaController.importManga);
router.get("/detail/:manganame", mangaController.getMangaOrChapter);
router.get(
  "/detail/:manganame/:chapname/:chapid",
  mangaController.getMangaOrChapter
);
router.get("/rating/:manganame", mangaController.getRatingManga);
router.get("/comments/new", commentController.getNewComment);
router.get("/comment/:manganame", commentController.getComment);
router.get(
  "/comment/:manganame/:chapname/:chapid",
  commentController.getComment
);
router.put("/conver", mangaController.convertData);
// ******** PRIVATE ROUTES ******
router.post("/comment/:manganame", protect, commentController.createComment);
router.post(
  "/comment/:manganame/:chapname/:chapid",
  protect,
  commentController.createComment
);
router.put("/comment/:id", protect, commentController.updateComment);
router.delete("/comment/:id", protect, commentController.deleteComment);
router.put("/emocomment/:id", protect, commentController.emoComment);
router.post("/feedback/:commentid", protect, commentController.createFeedBack);
router.post(
  "/feedback/:commentid/:feedbackid",
  protect,
  commentController.createFeedBack
);
router.put(
  "/feedback/:id/:feedbackid",
  protect,
  commentController.updateFeedBack
);
router.delete("/feedback", protect, commentController.deleteFeedBack);
router.put("/emofeedback", protect, commentController.emoFeedBack);
router.post("/rating/:manganame", protect, userController.ratingManga);
router.get("/recommend", protect, mangaController.getRecommend);
router.get("/collection", protect, mangaController.getCollectionList);

export default router;
