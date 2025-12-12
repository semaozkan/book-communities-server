import express from "express";
import {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteUserNotification,
  deleteAllUserNotifications,
} from "../controllers/userNotificationController.js";
import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

router.get("/", verifyToken, getUserNotifications);
router.put("/:id/read", verifyToken, markUserNotificationAsRead);
router.put("/read-all", verifyToken, markAllUserNotificationsAsRead);
router.delete("/delete-all", verifyToken, deleteAllUserNotifications);
router.delete("/:id", verifyToken, deleteUserNotification);

export default router;
