const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, "../uploads");

    if (file.fieldname === "userImage") {
      uploadPath = path.join(uploadPath, "user");
    } else if (
      file.fieldname === "contestlogo" ||
      file.fieldname === "banner"
    ) {
      uploadPath = path.join(uploadPath, "contest");
    } else if (
      file.fieldname === "seasonlogo" ||
      file.fieldname === "seasonBanner"
    ) {
      uploadPath = path.join(uploadPath, "season");
    } else {
      uploadPath = path.join(uploadPath, "others"); // Fallback
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (
    !file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP|gif|GIF)$/)
  ) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

module.exports = upload;
