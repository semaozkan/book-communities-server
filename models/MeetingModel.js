import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null }, // Seçilen kitap
    audioFileUrl: { type: String, default: null }, // Kitabın ses dosyası
    audioSyncJsonUrl: { type: String, default: null }, // Kitabın ses dosyasının eşleştirilmiş JSON dosyası
    currentTime: { type: Number, default: 0 }, // Audio'nun mevcut zamanı (saniye)
    isPlaying: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Katılımcılar
    chat: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    textSync: {
      page: { type: Number, default: 1 }, // Şu anki sayfa
      paragraph: { type: Number, default: 1 }, // Şu anki paragraf
    },
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

const MeetingModel = mongoose.model("Meeting", meetingSchema);

export default MeetingModel;
