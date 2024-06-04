import express from "express";
import { admin, protect, trans_goup } from "../middlewares/Auth.js";
import * as roleController from "../controllers/RoleController.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******

// ******** ADMIN ROUTES ***********
router.get("/", protect, trans_goup, roleController.getRole);
router.post("/", protect, admin, roleController.createRole);

export default router;
