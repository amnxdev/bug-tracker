import jwt from 'jsonwebtoken';

// 1. Verify JWT Token and populate req.user
export const verifyToken = (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trimStart();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      ...verified,
      _id: verified.id || verified._id,
      id: verified.id || verified._id,
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token", error: err.message });
  }
};

// 2. Role-Based Access Control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

// 3. Helper: check if a user can modify a bug (admin or creator)
export const canModifyBug = (user, bug) => {
  if (!user || !bug) return false;
  if (user.role === 'admin') return true;
  const createdById = bug.createdBy?._id ? bug.createdBy._id : bug.createdBy;
  const userId = user._id ? user._id : user.id;
  if (!createdById || !userId) return false;
  return String(createdById) === String(userId);
};
