import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose"; // ObjectId kontrolü için eklendi
// Socket.io ve http modülü
import http from "http";
import { Server } from "socket.io";

import MeetingModel from "./models/MeetingModel.js";
import User from "./models/UserModel.js";

import authRoute from "./routes/auth.route.js";
import bookRoute from "./routes/book.route.js";
import communityRoute from "./routes/community.route.js";
import postRoute from "./routes/post.route.js";
import notificationRoute from "./routes/notification.route.js";
import messageRoute from "./routes/message.route.js";
import donationRoute from "./routes/donation.route.js";
import meetingRoute from "./routes/meeting.route.js";
import userNotificationRoute from "./routes/userNotification.route.js";
import imageUploaderRoute from "./routes/imageUploader.route.js";

// Environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// http server oluştur
const server = http.createServer(app);
// Socket.io başlat
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Her oda için oynatma state'i tutulur
const roomAudioState = {};

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı:", socket.id);

  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);
    // Yeni gelen kullanıcıya mevcut audio durumu gönder
    if (roomAudioState[roomId]) {
      socket.emit("initialAudioState", roomAudioState[roomId]);
    }

    // roomId geçerli bir ObjectId mi kontrolü
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      console.error("Geçersiz roomId:", roomId);
      socket.emit("error", "Geçersiz oda ID");
      return;
    }

    // Katılımcı listesini güncelle ve yayınla
    try {
      const meeting = await MeetingModel.findById(roomId).populate(
        "participants",
        "username fullname profilePicture"
      );
      if (meeting) {
        io.to(roomId).emit("participantsUpdated", meeting.participants);
      }
    } catch (err) {
      console.error("participantsUpdated error (joinRoom):", err);
    }
  });

  socket.on("sendMessage", (data) => {
    io.to(data.roomId).emit("receiveMessage", data.message);
  });

  socket.on("audio-control", ({ roomId, isPlaying, currentTime }) => {
    roomAudioState[roomId] = { isPlaying, currentTime };
    socket.broadcast.to(roomId).emit("audio-state", { isPlaying, currentTime });
  });

  socket.on("meeting-message", async ({ meetingId, message, sender }) => {
    // meetingId geçerli bir ObjectId mi kontrolü
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      console.error("Geçersiz meetingId:", meetingId);
      socket.emit("error", "Geçersiz toplantı ID");
      return;
    }
    try {
      let senderObj = sender;
      // Eğer sender bir id ise, User tablosundan bilgileri çek
      if (
        typeof sender === "string" ||
        (sender && sender._id && !sender.username)
      ) {
        const userDoc = await User.findById(sender._id || sender).select(
          "username fullname profilePicture"
        );
        senderObj = userDoc
          ? {
              _id: userDoc._id,
              username: userDoc.username,
              fullname: userDoc.fullname,
              profilePicture: userDoc.profilePicture,
            }
          : sender;
      }
      const newMessage = {
        sender: senderObj,
        message,
        timestamp: new Date(),
      };
      await MeetingModel.findByIdAndUpdate(
        meetingId,
        { $push: { chat: newMessage } },
        { new: true }
      );
      io.to(meetingId).emit("meeting-message", newMessage);
    } catch (err) {
      console.error("Meeting message error:", err);
    }
  });

  socket.on("leaveMeeting", async ({ meetingId }) => {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      console.error("Geçersiz meetingId:", meetingId);
      socket.emit("error", "Geçersiz toplantı ID");
      return;
    }
    try {
      const meeting = await MeetingModel.findById(meetingId).populate(
        "participants",
        "username fullname profilePicture"
      );
      if (meeting) {
        io.to(meetingId).emit("participantsUpdated", meeting.participants);
      }
    } catch (err) {
      console.error("participantsUpdated error:", err);
    }
  });

  socket.on("endMeeting", async ({ meetingId }) => {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      console.error("Geçersiz meetingId:", meetingId);
      socket.emit("error", "Geçersiz toplantı ID");
      return;
    }
    try {
      const meeting = await MeetingModel.findById(meetingId);
      if (meeting) {
        // Audio state'i temizle
        delete roomAudioState[meetingId];
        // Tüm katılımcılara meetingEnded event'ini gönder
        io.to(meetingId).emit("meetingEnded");
        // Odadaki tüm socket'leri disconnect et
        const roomSockets = await io.in(meetingId).fetchSockets();
        // Önce tüm socket'leri odadan çıkar
        roomSockets.forEach((socket) => {
          socket.leave(meetingId);
        });
        // Sonra disconnect et
        roomSockets.forEach((socket) => {
          socket.disconnect(true);
        });
        // Odayı temizle
        io.socketsLeave(meetingId);
      }
    } catch (err) {
      console.error("Meeting end error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Kullanıcı ayrıldı:", socket.id);
  });
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/books", bookRoute);
app.use("/api/communities", communityRoute);
app.use("/api/posts", postRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/donations", donationRoute);
app.use("/api/meetings", meetingRoute);
app.use("/api/user-notifications", userNotificationRoute);
app.use("/api/image-uploader", imageUploaderRoute);

// Sunucuyu başlat
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
