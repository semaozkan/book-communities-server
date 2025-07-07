import mongoose from "mongoose";

const communityNotificationSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "JOIN_REQUEST",
        "JOIN_ACCEPTED",
        "NEW_POST",
        "NEW_COMMENT",
        "POST_LIKE",
        "COMMENT_LIKE",
        "ADMIN_ACTION",
        "NEW_MESSAGE",
        "JOIN_REJECTED",
        "MEETING_STARTED",
        "DONATION_REQUESTED",
        "DONATION_ACCEPTED",
        "DONATION_REJECTED",
        "DONATION_COMPLETED",
      ],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CommunityNotificationModel = mongoose.model(
  "CommunityNotification",
  communityNotificationSchema
);

export default CommunityNotificationModel;
