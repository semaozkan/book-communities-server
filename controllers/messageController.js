import MessageModel from "../models/MessageModel.js";
import CommunityNotificationModel from "../models/CommunityNotificationModel.js";
import User from "../models/UserModel.js";
import mongoose from "mongoose";
// User notification modeli (yoksa oluştur)
import UserNotificationModel from "../models/UserNotificationModel.js";

// Mesaj gönder(yeni modele göre)
export const sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, text, time } = req.body;
    const message = new MessageModel({ roomId, senderId, text, time });
    await message.save();

    // Bildirim oluştur: Oda id'sinden alıcıyı bul
    const userIds = roomId.split("-");
    const recipient = userIds.find((id) => id !== senderId.toString());
    if (recipient) {
      await UserNotificationModel.create({
        recipient,
        type: "NEW_MESSAGE",
        content: "Yeni bir mesajınız var!",
        relatedUser: senderId,
        isRead: false,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Kullanıcıya gelen mesajları getir
export const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const messages = await MessageModel.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username profilePicture")
      .populate("recipient", "username profilePicture")
      .sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kullanıcının mesajlaştığı kişileri getir
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    // Kullanıcının dahil olduğu tüm roomId'leri bul
    const messages = await MessageModel.find({
      roomId: { $regex: userId },
    });
    const roomIds = [...new Set(messages.map((m) => m.roomId))];
    const chatUsers = [];
    for (const roomId of roomIds) {
      const ids = roomId.split("-");
      const otherId = ids[0] === userId ? ids[1] : ids[0];
      // Sadece geçerli ObjectId ise sorgula
      if (mongoose.Types.ObjectId.isValid(otherId)) {
        const user = await User.findById(otherId).select(
          "_id fullname username profilePicture"
        );
        // En son mesajı bul
        const lastMessage = await MessageModel.findOne({ roomId }).sort({
          time: -1,
        });
        if (user) chatUsers.push({ user, roomId, lastMessage });
      }
    }
    res.json(chatUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// İki kullanıcı (roomId) arasındaki tüm mesajları getir
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await MessageModel.find({ roomId }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mesajı okundu olarak işaretle
export const readMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
