import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    book: {
      title: { type: String, required: true },
      author: { type: String, required: true },
      image: { type: String, required: true },
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    requesters: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        requestDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    selectedRequester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
