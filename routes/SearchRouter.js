import express from "express";
import * as mangaController from "../controllers/MangaController.js";

const router = express.Router();

// ******** PRIVATE ROUTES ***********
router.get("/pro", mangaController.getMangaPro);
router.get("/keyword", mangaController.getMangaByKeyWord);
router.get("/gender/:gender", mangaController.getMangaByGender);

export default router;
