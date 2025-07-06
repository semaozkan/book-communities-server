import { uploadFile } from "../lib/minioClient.js";
import User from "../models/UserModel.js";

export async function uploadPhoto(req, res) {
  console.log("uploadPhoto req.file:", req.file);
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file provided" });
    }

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.substring(originalname.lastIndexOf("."));
    const basename = originalname.replace(ext, "");
    const filename = `images/${basename}-${Date.now()}${ext}`;

    // push to Minio
    const { url } = await uploadFile(
      process.env.MINIO_BUCKET,
      filename,
      buffer,
      mimetype
    );

    res
      .status(200)
      .json({ success: true, message: "File uploaded successfully", url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
