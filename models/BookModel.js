import mongoose from "mongoose";

const summarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    publishingHouse: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    format: [
      {
        type: String,
        enum: ["audio", "read"],
        required: true,
      },
    ],
    category: {
      type: String,
      required: true,
    },
    introduction: {
      type: String,
      required: true,
    },
    translatedBy: {
      type: String,
      required: true,
    },
    audioBookUrl: {
      type: String,
      required: false,
      default: null,
    },
    audioSyncJsonUrl: {
      type: String,
      required: false,
      default: null,
    },
    summaries: [summarySchema],
    ratings: [ratingSchema],
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
