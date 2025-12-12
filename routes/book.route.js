import express from "express";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addSummary,
  getUserSummaries,
  updateAudioBookUrl,
  getAudioBooks,
  rateBook,
  searchBooks,
  deleteRating,
  deleteSummary,
} from "../controllers/book.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Kitap arama (query string ile)
router.get("/search", searchBooks);

// Tüm kitapları getir
router.get("/", getBooks);

// Kitaba puan ve yorum ekle/güncelle
router.post("/:id/rate", verifyToken, rateBook);

// Kitaptan rating sil
router.delete("/:id/rate", verifyToken, deleteRating);

// Sesli kitapları getir
router.get("/audio-books", getAudioBooks);

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

// Kitaptan özet sil
router.delete("/:id/summaries/:summaryId", verifyToken, deleteSummary);

// Sesli kitap URL'sini güncelle
router.patch("/:id/audio-url", updateAudioBookUrl);

// Kullanıcının yazdığı özetleri getir
router.get("/user/:userId/summaries", getUserSummaries);

export default router;
