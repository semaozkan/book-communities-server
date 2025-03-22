import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const register = async (req, res) => {
  const { fullname, username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    const newUser = await User({
      fullname: fullname,
      username: username,
      email: email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user!" });
  }
};
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username });

    if (!user) return res.status(401).json({ message: "User not found!" });

    //parola kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Wrong Password!" });
    }

    //token
    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json({ message: "successfuly login" });
  } catch (error) {
    res.status(500).json({ message: "Failed to login" });
    console.log(error);
  }
};
export const logout = async (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
