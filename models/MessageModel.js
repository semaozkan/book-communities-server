import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    time: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("Message", messageSchema);
export default MessageModel;
