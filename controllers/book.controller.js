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
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Kitap bulunamadı!" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Kitap getirilirken bir hata oluştu!" });
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
    const parsedDate = req.body.date
      ? new Date(req.body.date.replace(/\./g, "-"))
      : undefined;

    const summaryToAdd = {
      title: req.body.title,
      author: req.body.author,
      date: parsedDate,
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
