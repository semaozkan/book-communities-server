import express from "express";
import {
  getCommunityPosts,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
} from "../controllers/postController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Post routes
router.get("/community/:id", getCommunityPosts);
router.put("/:postId", verifyToken, updatePost);
router.delete("/:postId", verifyToken, deletePost);
router.post("/:postId/like", verifyToken, toggleLike);

// Comment routes
router.post("/:postId/comments", verifyToken, addComment);
router.delete("/:postId/comments/:commentId", verifyToken, deleteComment);

export default router;
