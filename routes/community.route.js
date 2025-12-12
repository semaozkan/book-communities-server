import express from "express";
import {
  createCommunity,
  getCommunities,
  getCommunity,
  updateCommunity,
  requestJoinCommunity,
  acceptJoinRequest,
  createPost,
  deleteCommunity,
  searchCommunities,
  getUserCommunities,
  updateCommunityImages,
  leaveCommunity,
  getCommunityStats,
  removeJoinRequest,
  rejectJoinRequest,
  removeMember,
} from "../controllers/communityController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Community routes
router.post("/", verifyToken, createCommunity);
router.get("/", getCommunities);
router.get("/search", searchCommunities);
router.get("/user", verifyToken, getUserCommunities);
router.get("/:id", getCommunity);
router.get("/:id/stats", getCommunityStats);
router.put("/:id", verifyToken, updateCommunity);
router.put("/:id/images", verifyToken, updateCommunityImages);
router.delete("/:id", verifyToken, deleteCommunity);

// Member management routes
router.post("/:id/join", verifyToken, requestJoinCommunity);
router.post("/:id/accept", verifyToken, acceptJoinRequest);
router.post("/:id/remove-request", verifyToken, removeJoinRequest);
router.post("/:id/leave", verifyToken, leaveCommunity);
router.post("/:id/reject-request", verifyToken, rejectJoinRequest);
router.post("/:id/remove-member", verifyToken, removeMember); // Admin removes a member

// Post routes
router.post("/:id/posts", verifyToken, createPost);

export default router;
