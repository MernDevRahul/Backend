const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const generateOtp = require("../utils/generateOtp");
const transporter = require("../utils/mailer");
const crypto = require("crypto");

const otpStore = new Map();

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

    return res
      .cookie("scan-to-vote-token", token, cookieOptions)
      .status(200)
      .json({
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

// Send Otp
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: `"Scan To Vote" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "🔐 Your Secure OTP for Scan To Vote",
      html: `
  <div style="background:#f4f6fb;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#3b82f6);padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">
          Scan To Vote
        </h1>
        <p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">
          Secure OTP Verification
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;color:#374151;">
        <h2 style="margin-top:0;font-size:20px;">Verify Your Login</h2>
        <p style="font-size:15px;line-height:1.6;">
          We received a request to sign in to your <b>Scan To Vote</b> account.
          Please use the OTP below to continue:
        </p>

        <!-- OTP Box -->
        <div style="margin:30px 0;text-align:center;">
          <span style="
            display:inline-block;
            background:#f1f5f9;
            padding:16px 28px;
            font-size:28px;
            letter-spacing:6px;
            color:#1e3a8a;
            font-weight:bold;
            border-radius:10px;
            border:1px dashed #c7d2fe;
          ">
            ${otp}
          </span>
        </div>

        <p style="font-size:14px;color:#6b7280;">
          ⏳ This OTP is valid for <b>5 minutes</b>.  
          Please do not share this code with anyone.
        </p>

        <p style="font-size:14px;color:#6b7280;margin-top:24px;">
          If you did not request this login, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
        © ${new Date().getFullYear()} Scan To Vote. All rights reserved.
      </div>

    </div>
  </div>
  `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your gmail",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const data = otpStore.get(email);

    if (!data) {
      return res.status(400).json({ message: "OTP Not Found" });
    }

    if (Date.now() > data.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.delete(email);

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Forget Password
exports.forgotPassowrd = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔐 Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token in DB
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save({ validateBeforeSave: false });

    // 🔗 Reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 📩 Email template
    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <a href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #4f46e5;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 10px;
          ">
          Reset Password
        </a>
        <p style="margin-top: 20px; font-size: 12px;">
          This link will expire in 15 minutes.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Scan To Vote" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassowrd:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });

        const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({ success: true, message: error.message });
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
      data: user,
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
