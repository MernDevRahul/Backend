const express = require("express");
const {createContest, getAllContests, deleteContest} = require("../controllers/contest.controller");
const upload = require("../middleware/multer");
const router = express.Router();

// create Contest
router.post("/create", upload.fields([{ name: "contestlogo", maxCount: 1 }, { name: "banner", maxCount: 1 },]), createContest,);

// get all contests
router.get("/all", getAllContests);

// Delete Contest
router.delete("/delete/:id", deleteContest);

module.exports = router;
