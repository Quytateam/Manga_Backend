import express from "express";
import { admin, protect } from "../middlewares/Auth.js";
import * as requestController from "../controllers/RequestController.js";

const router = express.Router();

// ******** PRIVATE ROUTES ******
router.post("/create", protect, requestController.createRequest);

export default router;
