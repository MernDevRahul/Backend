const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const ContestAccessSchema = new Schema(
  {
    contestId: {
      type: Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { _id: false },
);

const SeasonAccessSchema = new Schema(
  {
    seasonId: {
      type: Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "client", "admin", "sponsor", "judge"],
    },
    profile: { type: String },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
    },

    // Only for client
    contests: {
      type: [ContestAccessSchema],
      default: undefined, // prevents empty array for others
    },

    //   Only for admin / sponsor / judge
    seasons: {
      type: [SeasonAccessSchema],
      default: undefined,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
