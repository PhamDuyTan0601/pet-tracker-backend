const User = require("../models/user");
const mongoose = require("mongoose");

const auth = async (req, res, next) => {
  try {
    let userId =
      req.headers.userId ||
      req.headers.userid ||
      req.headers["user-id"] ||
      req.query.userId ||
      req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide user ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

module.exports = auth;
