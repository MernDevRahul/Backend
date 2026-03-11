const express = require("express");
const { protect } = require("../middleware/protect");
const { createUser, updateUser, getAllUsers, deleteUser } = require("../controllers/user.controller");
const upload = require("../middleware/multer");

const router = express.Router();

router.post(
  "/create-user",
  protect(["owner", "client", "admin"]),
  upload.single("userImage"),
  createUser,
);

router.put(
  "/update-user/:id",
  protect(["owner", "client", "admin"]),
  upload.single("userImage"),
  updateUser,
);

router.get(
  "/get-all-users",
  protect(["owner", "client", "admin"]),
  getAllUsers,
);

router.delete(
  "/delete-user/:id",
  protect(["owner", "client", "admin"]),
  deleteUser,
);

module.exports = router;
