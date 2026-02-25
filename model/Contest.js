const { default: mongoose } = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: String,
    logo: String,
    website: String,

    // Client Reference (Owner of this Contest)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional: If you allow multiple clients managing same contest later
    clientManagers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // SaaS Plan
    // plan: {
    //   type: String,
    //   enum: ["free", "pro", "enterprise"],
    //   default: "free",
    //   index: true,
    // },
    // subscription: {
    //   isActive: { type: Boolean, default: false, index: true },
    //   startDate: Date,
    //   endDate: Date,
    //   paymentId: String,
    //   paymentProvider: {
    //     type: String,
    //     enum: ["razorpay", "stripe", null],
    //     default: null,
    //   },
    // },
    // Feature Limits (important for SaaS control)
    // limits: {
    //   maxSeasons: { type: Number, default: 1 },
    //   maxParticipantsPerSeason: { type: Number, default: 100 },
    //   maxVotesPerSeason: { type: Number, default: 1000 },
    //   maxAdminsPerSeason: { type: Number, default: 2 },
    //   maxJudgesPerSeason: { type: Number, default: 5 },
    // },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Analytics Ready Fields (Optional but useful)
    totalSeasons: {
      type: Number,
      default: 0,
    },

    totalParticipants: {
      type: Number,
      default: 0,
    },

    totalVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// For dashboard query (client sees his contests)
ContestSchema.index({ clientId: 1, status: 1 });

// For SaaS plan filtering
// ContestSchema.index({ plan: 1, status: 1 });

// For soft-delete safety
ContestSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Contest", ContestSchema);
