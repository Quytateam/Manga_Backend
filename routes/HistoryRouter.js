import express from "express";
import { protect } from "../middlewares/Auth.js";
import {
  addHistory,
  deleteHistory,
  getHistory,
} from "../controllers/HistoryController.js";

const router = express.Router();

// ******** PRIVATE ROUTES ***********
router.get("/", protect, getHistory);
router.post("/:manganame/:chapname/:chapid", protect, addHistory);
router.delete("/:id", protect, deleteHistory);

export default router;
