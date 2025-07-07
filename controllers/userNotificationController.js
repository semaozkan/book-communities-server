import UserNotificationModel from "../models/UserNotificationModel.js";

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await UserNotificationModel.find({
      recipient: req.userId,
    })
      .populate("relatedUser", "username profilePicture")
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a user notification as read
export const markUserNotificationAsRead = async (req, res) => {
  try {
    const notification = await UserNotificationModel.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    notification.isRead = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all user notifications as read
export const markAllUserNotificationsAsRead = async (req, res) => {
  try {
    await UserNotificationModel.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: "All user notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toplu silme
export const deleteAllUserNotifications = async (req, res) => {
  try {
    await UserNotificationModel.deleteMany({ recipient: req.userId });
    res.status(200).json({ message: "Tüm kullanıcı bildirimleri silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a user notification
export const deleteUserNotification = async (req, res) => {
  try {
    const notification = await UserNotificationModel.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await notification.deleteOne();
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
