import express from "express";
import {
  startMeeting,
  getMeeting,
  joinMeeting,
  endMeeting,
  selectBook,
  leaveMeeting,
} from "../controllers/meetingController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Meeting routes
router.post("/start", verifyToken, startMeeting); // Toplantı başlat
router.get("/:id", verifyToken, getMeeting); // Toplantı bilgisi getir
router.post("/:id/join", verifyToken, joinMeeting); // Toplantıya katıl
router.post("/:id/end", verifyToken, endMeeting); // Toplantıyı bitir
router.patch("/:id/select-book", verifyToken, selectBook); // Kitap ve audio seçimi
router.post("/:id/leave", verifyToken, leaveMeeting); // Toplantıdan ayrıl

export default router;
