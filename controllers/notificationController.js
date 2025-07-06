import CommunityNotificationModel from "../models/CommunityNotificationModel.js";

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await CommunityNotificationModel.find({
      recipient: req.userId,
    })
      .populate("community", "name profileImage")
      .populate("relatedUser", "username profileImage")
      .populate("relatedPost", "content")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await CommunityNotificationModel.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
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

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await CommunityNotificationModel.updateMany(
      {
        recipient: req.userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await CommunityNotificationModel.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await notification.deleteOne();
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all community notifications
export const deleteAllCommunityNotifications = async (req, res) => {
  try {
    await CommunityNotificationModel.deleteMany({ recipient: req.userId });
    res.status(200).json({ message: "Tüm topluluk bildirimleri silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notification (helper function for other controllers)
export const createNotification = async ({
  community,
  recipient,
  type,
  content,
  relatedUser,
  relatedPost,
}) => {
  try {
    const notification = new CommunityNotificationModel({
      community,
      recipient,
      type,
      content,
      relatedUser,
      relatedPost,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
