import express from "express";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addSummary,
  getUserSummaries,
} from "../controllers/book.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Tüm kitapları getir
router.get("/", getBooks);

// Tek bir kitabı getir
router.get("/:id", getBook);

// Yeni kitap ekle
router.post("/", createBook);

// Kitap güncelle
router.put("/:id", updateBook);

// Kitap sil
router.delete("/:id", deleteBook);

// Kitaba özet ekle

router.post("/:id/summaries", verifyToken, addSummary);

// Kullanıcının yazdığı özetleri getir
router.get("/user/:userId/summaries", getUserSummaries);

export default router;
