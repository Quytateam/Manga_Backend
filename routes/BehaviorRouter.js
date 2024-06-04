import express from "express";
import { protect } from "../middlewares/Auth.js";
import {
  autoTimeRead,
  stopCronJob,
} from "../controllers/BehaviorController.js";

const router = express.Router();

// ******** PRIVATE ROUTES ***********
router.post("/:manganame/:chapname/:chapid", protect, autoTimeRead);
router.get("/stop-cron", protect, stopCronJob);

export default router;
