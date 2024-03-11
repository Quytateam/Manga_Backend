import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import * as mangaController from "../controllers/MangaController.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.post("/import", mangaController.importManga);
router.get("/:id", mangaController.getMangaById);

export default router;
