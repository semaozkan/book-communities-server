import express from "express";
import multer from "multer";
import { uploadPhoto } from "../controllers/imageUploader.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route POST /api/profile/upload-photo
 * @desc  Upload a user profile image to Minio and update MongoDB
 */
router.post(
  "/upload",
  upload.single("file"), // <-- multer parses “file” into req.file
  uploadPhoto // your controller logic (see below)
);

export default router;
