const User = require("../model/User");
const bcrypt = require('bcrypt');


//  Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, profile, contests, seasons } =
      req.body;

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

    if (profile) userData.profile = profile;
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