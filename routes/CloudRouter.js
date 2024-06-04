import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import { uploadFile, uploadProfile } from "../controllers/CloudController.js";
import upload from "../middlewares/multer.js";
// import * as categoriesController from "../controllers/CategoriesController.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******

// ******** ADMIN ROUTES ***********
router.post("/upload", upload.single("file"), uploadFile);
router.post("/profile", upload.single("file"), uploadProfile);
export default router;
