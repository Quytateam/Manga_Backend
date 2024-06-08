import express from "express";
import {
  loginGoogle,
  loginGoogleSucces,
} from "../controllers/UserController.js";
import passport from "../config/passport.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.get("/callback", loginGoogle);
router.post("/success", loginGoogleSucces);

export default router;
