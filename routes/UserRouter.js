import express from "express";
import {
  addFollowingManga,
  changeUserPassword,
  createUserPassword,
  deleteAllFollowingManga,
  deleteFollowingManga,
  deleteUser,
  deleteUserProfile,
  enableUser,
  forgetPassword,
  getAllFollowingManga,
  getCommentUser,
  getDataReadUser,
  getFollowingManga,
  getNotificationUser,
  getUserInfo,
  getUsers,
  hiddenNotificationUser,
  loginUser,
  registerUser,
  resendEmailVerificationToken,
  resetPassword,
  sendResetPasswordTokenStatus,
  setAdminUser,
  updateUserProfile,
  verifyEmail,
} from "../controllers/UserController.js";
import { admin, protect } from "../middlewares/Auth.js";
import { isValidPassResetToken } from "../middlewares/user.js";
import { validate, validatePassword } from "../middlewares/validator.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.post("/", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordTokenStatus
);
router.patch(
  "/reset-password",
  validatePassword,
  validate,
  isValidPassResetToken,
  resetPassword
);
router.post("/login", loginUser);
router.get("/userinfo/:id", getUserInfo);

// ******** PRIVATE ROUTES ***********
router.put("/", protect, updateUserProfile);
router.delete("/", protect, deleteUserProfile);
router.patch("/password", protect, changeUserPassword);
router.patch("/createpassword", protect, createUserPassword);
router.get("/follow", protect, getFollowingManga);
router.get("/allfollow", protect, getAllFollowingManga);
router.post("/follow", protect, addFollowingManga);
router.delete("/follow/:id", protect, deleteFollowingManga);
router.delete("/follow", protect, deleteAllFollowingManga);
router.post(
  "/follow/:manganame/:chapname/:chapid",
  protect,
  deleteAllFollowingManga
);
router.get("/comment", protect, getCommentUser);
router.get("/notification", protect, getNotificationUser);
router.patch("/notification/:id", protect, hiddenNotificationUser);
router.get("/dataread/:manganame", protect, getDataReadUser);
// ******** ADMIN ROUTES ***********
router.get("/", protect, admin, getUsers);
router.delete("/:id", protect, admin, deleteUser);
router.patch("/enable/:id", protect, admin, enableUser);
router.patch("/admin/:id", protect, admin, setAdminUser);

export default router;
