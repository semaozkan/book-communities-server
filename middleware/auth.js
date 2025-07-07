import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Önce cookie'den, yoksa Authorization header'dan al
  let token = req.cookies.token;
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Yetkilendirme başarısız!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Geçersiz token!" });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok!" });
  }
  next();
};
