const express = require("express");
const { protect } = require("../middleware/protect");
const { createUser, updateUser, getAllUsers, deleteUser, getUserById, getUsersByRole } = require("../controllers/user.controller");
const upload = require("../middleware/multer");

const router = express.Router();

router.post("/create-user", protect(["owner", "client", "admin"]),upload.single("userImage"),createUser);

router.put("/update-user/:id", protect(["owner", "client", "admin"]), upload.single("userImage"), updateUser );

router.get("/get-all-users", protect(["owner", "client", "admin"]), getAllUsers );

router.get("/get-users-by-id/:id", protect(["owner", "client", "admin"]), getUserById );
router.get("/get-users-by-role/:role", protect(["owner", "client", "admin"]), getUsersByRole );

router.delete("/delete-user/:id", protect(["owner", "client", "admin"]), deleteUser );

module.exports = router;
