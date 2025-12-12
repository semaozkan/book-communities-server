import express from "express";
import {
  sendMessage,
  getUserChats,
  getRoomMessages,
  readMessage,
} from "../controllers/messageController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Mesaj gönder
router.post("/", verifyToken, sendMessage);

// Kullanıcının mesajlaştığı kişileri getir
router.get("/chats/:userId", verifyToken, getUserChats);

// İki kullanıcı (roomId) arasındaki tüm mesajları getir
router.get("/room/:roomId", verifyToken, getRoomMessages);

// Mesajı okundu olarak işaretle
router.put("/:messageId/read", verifyToken, readMessage);

export default router;
