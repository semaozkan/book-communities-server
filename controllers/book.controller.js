import Book from "../models/BookModel.js";
import User from "../models/UserModel.js";

// Tüm kitapları getir
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Kitaplar getirilirken bir hata oluştu!" });
  }
};

// Tek bir kitabı getir
export const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      "ratings.user",
      "fullname username profilePicture"
    );

    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }

    // Ortalama puan hesapla
    const ratings = book.ratings || [];
    const averageRating = ratings.length
      ? (
          ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        ).toFixed(2)
      : null;
    res.status(200).json({
      ...book.toObject(),
      averageRating,
      ratings,
    });
  } catch (error) {
    res.status(500).json({ message: "Kitap getirilirken bir hata oluştu!" });
  }
};

// Kitaba puan ve yorum ekle/güncelle
export const rateBook = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.userId || req.body.userId; // auth middleware varsa req.userId kullan
    if (!rating || !comment) {
      return res.status(400).json({ message: "Puan ve yorum zorunlu." });
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    // Kullanıcı daha önce puanladıysa güncelle
    const existing = book.ratings.find((r) => r.user.toString() === userId);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.createdAt = new Date();
    } else {
      book.ratings.push({ user: userId, rating, comment });
    }
    await book.save();
    // Ortalama puan hesapla
    const avg = book.ratings.length
      ? (
          book.ratings.reduce((sum, r) => sum + r.rating, 0) /
          book.ratings.length
        ).toFixed(2)
      : null;
    // Ratings'i populate et
    const populatedRatings = await Book.populate(book.ratings, {
      path: "user",
      select: "fullname username profilePicture",
    });
    res.status(200).json({
      message: "Puan eklendi/güncellendi",
      average: avg,
      ratings: populatedRatings,
    });
  } catch (error) {
    res.status(500).json({ message: "Puan eklenirken hata oluştu!" });
  }
};

// Yeni kitap ekle
export const createBook = async (req, res) => {
  try {
    const newBook = new Book(req.body);
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: "Kitap eklenirken bir hata oluştu!" });
  }
};

// Kitap güncelle
export const updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Kitap güncellenirken bir hata oluştu!" });
  }
};

// Kitap sil
export const deleteBook = async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    res.status(200).json({ message: "Kitap başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Kitap silinirken bir hata oluştu!" });
  }
};

// Kitaba özet ekle
export const addSummary = async (req, res) => {
  try {
    const summaryToAdd = {
      title: req.body.title,
      author: req.body.author,
      date: req.body.date,
      content: req.body.content,
      userId: req.userId,
    };

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $push: { summaries: summaryToAdd } },
      { new: true, runValidators: true } // <-- sadece yeni özeti validate eder
    ).exec();

    if (!updatedBook) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }

    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { summaries: req.params.id },
    });

    res.status(200).json(updatedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Kullanıcının yazdığı özetleri getir
export const getUserSummaries = async (req, res) => {
  try {
    const userId = req.params.userId;
    // 1. İçinde özet olan tüm kitapları bul
    const books = await Book.find({ "summaries.userId": userId });
    // 2. Her kitapta, sadece bu kullanıcıya ait özetleri filtrele
    const userSummaries = books.flatMap((book) =>
      book.summaries
        .filter((summary) => summary.userId.toString() === userId)
        .map((summary) => ({
          ...summary.toObject(),
          bookId: book._id,
          bookTitle: book.title,
          bookImage: book.img,
        }))
    );
    res.status(200).json(userSummaries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Kullanıcı özetleri getirilirken bir hata oluştu!" });
  }
};

// Kitaptan rating sil
export const deleteRating = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId; // Auth middleware varsa req.userId kullan
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    const initialLength = book.ratings.length;
    book.ratings = book.ratings.filter((r) => r.user.toString() !== userId);
    if (book.ratings.length === initialLength) {
      return res
        .status(404)
        .json({ message: "Bu kullanıcıya ait puan bulunamadı!" });
    }
    await book.save();
    // Ratings'i populate et
    const populatedRatings = await Book.populate(book.ratings, {
      path: "user",
      select: "fullname username profilePicture",
    });
    // Ortalama puan hesapla
    const avg = book.ratings.length
      ? (
          book.ratings.reduce((sum, r) => sum + r.rating, 0) /
          book.ratings.length
        ).toFixed(2)
      : null;
    res.status(200).json({
      message: "Puan silindi.",
      average: avg,
      ratings: populatedRatings,
    });
  } catch (error) {
    res.status(500).json({ message: "Puan silinirken hata oluştu!" });
  }
};

// Kitaptan özet sil
export const deleteSummary = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const summaryId = req.params.summaryId;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    const initialLength = book.summaries.length;
    book.summaries = book.summaries.filter(
      (s) => s._id.toString() !== summaryId || s.userId.toString() !== userId
    );
    if (book.summaries.length === initialLength) {
      return res
        .status(404)
        .json({ message: "Bu kullanıcıya ait özet bulunamadı!" });
    }
    await book.save();
    // Kullanıcının özet listesinden de bu kitabı çıkar
    await User.findByIdAndUpdate(userId, {
      $pull: { summaries: req.params.id },
    });
    res.status(200).json({
      message: "Özet silindi.",
      summaries: book.summaries,
    });
  } catch (error) {
    res.status(500).json({ message: "Özet silinirken hata oluştu!" });
  }
};

// Kitabın sadece audioBookUrl alanını güncelle
export const updateAudioBookUrl = async (req, res) => {
  try {
    const { audioBookUrl, audioSyncJsonUrl } = req.body;
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { audioBookUrl, audioSyncJsonUrl } },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({
      message:
        "audioBookUrl veya audioSyncJsonUrl güncellenirken bir hata oluştu!",
    });
  }
};

// Sadece sesli kitapları getir
export const getAudioBooks = async (req, res) => {
  try {
    const audioBooks = await Book.find({
      audioBookUrl: { $exists: true, $ne: null },
    });
    res.status(200).json(audioBooks);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Sesli kitaplar getirilirken bir hata oluştu!" });
  }
};

// Kitap arama (title, author, description)
export const searchBooks = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Arama sorgusu gerekli." });
    }
    const regex = new RegExp(query, "i");
    const books = await Book.find({
      $or: [
        { title: { $regex: regex } },
        { author: { $regex: regex } },
        { description: { $regex: regex } },
      ],
    });
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({
      message: "Kitap arama sırasında hata oluştu!",
      error: error.message,
    });
  }
};
