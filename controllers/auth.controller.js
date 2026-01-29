const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/User');

// @desc    Create a new user
// @route   POST /auth/create-user
// @access  Public (adjust later if needed)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, profile, contests, seasons, } = req.body;

    // Basic validation
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, phone, and role',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
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
      message: 'User created successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// @desc    Login user and set JWT cookie
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:
        (parseInt(process.env.JWT_COOKIE_DAYS || '7', 10) || 7) *
        24 *
        60 *
        60 *
        1000,
    };

    const userObj = user.toObject();
    delete userObj.password;

    return res
      .cookie('token', token, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: 'Logged in successfully',
        data: userObj,
      });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// @desc    Logout user (clear JWT cookie)
// @route   POST /auth/logout
// @access  Public/Authenticated
exports.logout = (req, res) => {
  try {
    return res
      .clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })
      .status(200)
      .json({
        success: true,
        message: 'Logged out successfully',
      });
  } catch (error) {
    console.error('Error logging out:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
