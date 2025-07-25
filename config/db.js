// const mongoose = require("mongoose");

// const connectDB = async () => {
//   console.log(process.env.MONGO_URI);

//   try {
//     mongoose
//       .connect(process.env.MONGO_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       })
//       .then(() => console.log("MongoDB connected"))
//       .catch((error) => console.error("Error connecting to MongoDB:", error));
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1);
//   }
// };

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
