import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllCommunityNotifications,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Notification routes
router.get("/", verifyToken, getUserNotifications);
router.put("/:id/read", verifyToken, markNotificationAsRead);
router.put("/read-all", verifyToken, markAllNotificationsAsRead);
router.delete("/delete-all", verifyToken, deleteAllCommunityNotifications);
router.delete("/:id", verifyToken, deleteNotification);

export default router;
