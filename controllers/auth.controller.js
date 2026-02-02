const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

// @desc    Login user and set JWT cookie
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:
        (parseInt(process.env.JWT_COOKIE_DAYS || "7", 10) || 7) *
        24 *
        60 *
        60 *
        1000,
    };

    const userObj = user.toObject();
    delete userObj.password;

    return res.cookie("scan-to-vote-token", token, cookieOptions).status(200).json({
      success: true,
      message: "Logged in successfully",
      data: userObj,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Logout user (clear JWT cookie)
// @route   POST /auth/logout
// @access  Public/Authenticated
exports.logout = (req, res) => {
  try {
    return res
      .clearCookie("scan-to-vote-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.fetchOwner = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id).select("-password");

    res.status(200).json({
      success: true,
      message: "Owner Fetch Successfully",
      data: user
    })

  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
