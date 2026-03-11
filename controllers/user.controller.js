const User = require("../model/User");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

//  Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, contests, seasons } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, password, phone, and role",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user payload
    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    };

    let profileImage;
    if (req.file && req.file.fieldname === "userImage") {
      profileImage = `/uploads/user/${req.file.filename}`;
    }

    if (profileImage) userData.profile = profileImage;
    if (contests) userData.contests = contests;
    if (seasons) userData.seasons = seasons;

    const user = await User.create(userData);

    // Hide password in response
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userObj,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone, role, contests, seasons } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (contests) user.contests = contests;
    if (seasons) user.seasons = seasons;

    if (req.file && req.file.fieldname === "userImage") {
      // Delete old image if it exists and it's from the uploads folder
      if (user.profile && user.profile.startsWith("/uploads/")) {
        const oldImagePath = path.join(__dirname, "..", user.profile);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      user.profile = `/uploads/user/${req.file.filename}`;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userObj,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Users Except Owner
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "owner" } }).select("-password");
    
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get User by Id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete image if it exists and it's from the uploads folder
    if (user.profile && user.profile.startsWith("/uploads/")) {
      const imagePath = path.join(__dirname, "..", user.profile);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
