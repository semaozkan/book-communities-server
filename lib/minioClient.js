// lib/minioClient.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { createRequire } from "node:module";
import dotenv from "dotenv";
dotenv.config();

const require = createRequire(import.meta.url);
const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT, 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

async function ensureBucket(bucket) {
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket, "us-east-1");
  }
}

export async function uploadFile(bucket, filename, buffer, contentType) {
  await ensureBucket(bucket);

  return new Promise((resolve, reject) => {
    minioClient.putObject(
      bucket,
      filename,
      buffer,
      buffer.length,
      { "Content-Type": contentType },
      (err, etag) => {
        if (err) return reject(err);
        const url =
          `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://` +
          `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${filename}`;
        resolve({ etag, url });
      }
    );
  });
}
