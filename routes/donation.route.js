import express from "express";
import {
  getDonations,
  getDonation,
  createDonation,
  requestDonation,
  cancelRequest,
  completeDonation,
  getUserDonations,
  cancelDonation,
} from "../controllers/donation.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Tüm bağışları getir
router.get("/", verifyToken, getDonations);

// Tek bir bağışı getir
router.get("/:id", verifyToken, getDonation);

// Yeni bağış oluştur
router.post("/", verifyToken, createDonation);

// Bağış talebi oluştur
router.post("/:donationId/request", verifyToken, requestDonation);

// Bağış talebini iptal et
router.delete("/:donationId/request", verifyToken, cancelRequest);

// Bağışı tamamla
router.put("/:donationId/complete", verifyToken, completeDonation);

// Bağışı iptal et
router.put("/:donationId/cancel", verifyToken, cancelDonation);

// Kullanıcının bağışlarını getir
router.get("/user/:userId", verifyToken, getUserDonations);

export default router;
