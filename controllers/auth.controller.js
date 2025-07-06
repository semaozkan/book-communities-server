import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const register = async (req, res) => {
  const { fullname, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Bu email veya kullanıcı adı zaten kullanılıyor!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    const newUser = await User({
      fullname: fullname,
      username: username,
      email: email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Kullanıcı oluşturulurken bir hata oluştu!" });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user)
      return res
        .status(401)
        .json({ message: "E-posta adresiniz ve/veya şifreniz hatalı." });

    if (!user.isActive) {
      return res.status(401).json({ message: "Hesabınız aktif değil!" });
    }

    //parola kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "E-posta adresiniz ve/veya şifreniz hatalı." });
    }

    //token
    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user._doc;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
        sameSite: "Lax",
        secure: false,
      })
      .status(200)
      .json({ user: userInfo });
  } catch (error) {
    res.status(500).json({ message: "Giriş yapılırken bir hata oluştu!" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Çıkış başarılı" });
};

// Kullanıcı profilini getir
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Profil bilgileri alınırken bir hata oluştu!" });
  }
};

// Kullanıcı profilini güncelle
export const updateProfile = async (req, res) => {
  try {
    const { fullname, bio, profilePicture, coverImage } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          fullname,
          bio,
          profilePicture,
          coverImage,
        },
      },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Profil güncellenirken bir hata oluştu!" });
  }
};

// Şifre değiştir
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mevcut şifre hatalı!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Şifre başarıyla değiştirildi" });
  } catch (error) {
    res.status(500).json({ message: "Şifre değiştirilirken bir hata oluştu!" });
  }
};

// Favorilere kitap ekle/çıkar
export const toggleFavorite = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: "Eksik bookId!" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      console.log("Kullanıcı bulunamadı!");
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }

    user.favorites = user.favorites.filter((fav) => fav !== null);

    const index = user.favorites.findIndex(
      (fav) => fav && fav.toString() === bookId
    );
    if (index === -1) {
      user.favorites.push(bookId);
      console.log("Kitap favorilere eklendi:", bookId);
    } else {
      user.favorites.splice(index, 1);
      console.log("Kitap favorilerden çıkarıldı:", bookId);
    }

    await user.save();
    await user.populate("favorites");
    console.log("Favoriler güncellendi:", user.favorites);

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error("Favoriler güncellenirken bir hata oluştu:", error);
    res.status(500).json({
      message: "Favoriler güncellenirken bir hata oluştu!",
      error: error.message,
      stack: error.stack,
    });
  }
};

// ID ile kullanıcı detaylarını getir
// !TODO: fix this.
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("favorites", "title author img")
      .populate("summaries", "title author date")
      .populate("communities", "name description");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Kullanıcı bilgileri alınırken bir hata oluştu!" });
  }
};

// Kullanıcının favori kitaplarını getir
export const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("favorites")
      .populate("favorites");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: "Favoriler alınırken bir hata oluştu!" });
  }
};

// Kullanıcının topluluklarını getir
export const getUserCommunities = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("communities")
      .populate("communities");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }

    res.status(200).json(user.communities);
  } catch (error) {
    res.status(500).json({ message: "Topluluklar alınırken bir hata oluştu!" });
  }
};
