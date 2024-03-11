import express from "express";
import {
  addFollowingManga,
  changeUserPassword,
  deleteAllFollowingManga,
  deleteFollowingManga,
  deleteUser,
  deleteUserProfile,
  getFollowingManga,
  getUsers,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controllers/UserController.js";
import { admin, protect } from "../middlewares/Auth.js";

const router = express.Router();

// ******** PUBLIC ROUTES ******
router.post("/", registerUser);
router.post("/login", loginUser);

// ******** PRIVATE ROUTES ***********
router.put("/", protect, updateUserProfile);
router.delete("/", protect, deleteUserProfile);
router.patch("/password", protect, changeUserPassword);
router.get("/follow", protect, getFollowingManga);
router.post("/follow", protect, addFollowingManga);
router.delete("/follow/:id", protect, deleteFollowingManga);
router.delete("/follow", protect, deleteAllFollowingManga);

// ******** ADMIN ROUTES ***********
router.get("/", protect, admin, getUsers);
router.delete("/:id", protect, admin, deleteUser);

export default router;
