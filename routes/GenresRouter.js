import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import * as genresController from "../controllers/GenresController.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.get("/noextend", genresController.getGenresNoExtend);
router.get("/extend", genresController.getGenresExtend);
router.get("/genre", genresController.getMangaByGenre);
router.get("/genre/:genre", genresController.getMangaByGenre);

// ******** ADMIN ROUTES ***********
router.get("/", protect, admin, genresController.getGenres);
router.post("/import", protect, admin, genresController.importGenre);
router.post("/", protect, admin, genresController.createGenre);
router.put("/:id", protect, admin, genresController.updateGenre);
router.delete("/:id", protect, admin, genresController.deleteGenre);
router.patch("/:id", protect, admin, genresController.enableGenre);

export default router;
