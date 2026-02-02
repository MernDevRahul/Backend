const User = require("../model/User");

exports.getAllClients = async (req, res) => {
  try {
    const clients = await User.find({role: "client"}).select("-password").lean();
    res.status(200).json({
      success: true,
      message: "Clients Fetch Successfully",
      data: clients
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
