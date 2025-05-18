import express from "express";
import {
  login,
  logout,
  register,
  getProfile,
  updateProfile,
  changePassword,
  toggleFavorite,
  getUserById,
  getUserSummaries,
  getUserFavorites,
  getUserCommunities,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);
router.post("/favorites", verifyToken, toggleFavorite);

// User detail routes
router.get("/:id", getUserById);
router.get("/:id/summaries", getUserSummaries);
router.get("/:id/favorites", getUserFavorites);
router.get("/:id/communities", getUserCommunities);

export default router;
