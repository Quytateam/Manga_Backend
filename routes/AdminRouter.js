import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import * as adminController from "../controllers/AdminController.js";

const router = express.Router();

// ******** PRIVATE ROUTES ***********
router.get("/managermanga", protect, adminController.getManagerManga);
router.get("/joinup", protect, adminController.getManagerMangaForMember);
router.get("/mangainfo/:id", protect, adminController.getMangaInfo);
router.post("/manga/create", protect, adminController.createManga);
router.put("/manga/:id", protect, adminController.updateManga);
router.patch("/managermanga", protect, adminController.enableManga);
router.delete("/managermanga", adminController.deleteManga);
router.put("/addmember", protect, adminController.addMember);
router.put("/transfer", protect, adminController.transferOfOwnership);
router.get("/managerchap/:id", protect, adminController.getManagerChapter);
router.get("/chapterinfo/:id", protect, adminController.getChapterInfo);
router.post("/createchap/:id", protect, adminController.createChapter);
router.put("/updatechap/:id/:chapid", protect, adminController.updateChapter);
router.patch("/managerchap/:id", protect, adminController.enableChapter);
router.delete("/managerchap/:id", adminController.deleteChapter);
router.get("/users", protect, adminController.getListUser);

// ******** ADMIN ROUTES ***********
router.get("/allmanga", protect, admin, adminController.getAllManga);

export default router;
