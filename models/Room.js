// models/Room.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  audioFileUrl: { type: String, required: true },
  currentTime: { type: Number, default: 0 }, // Time in seconds
  isPlaying: { type: Boolean, default: false },
  users: [{ type: String }], // Array of user IDs
});

module.exports = mongoose.model("Room", RoomSchema);
