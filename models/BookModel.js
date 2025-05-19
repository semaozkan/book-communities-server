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
    summaries: [summarySchema],
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
