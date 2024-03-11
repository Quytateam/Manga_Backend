import express from "express";
import { protect } from "../middlewares/Auth.js";

const router = express.Router();

// ******** PRIVATE ROUTES ***********
router.get("/", protect);

export default router;
