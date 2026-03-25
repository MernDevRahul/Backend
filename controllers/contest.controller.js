const Contest = require("../model/Contest");
const User = require("../model/User");
const slugify = require("slugify");
const bcrypt = require("bcrypt");
const transporter = require("../utils/mailer");
const fs = require("fs");
const path = require('path');

// Create a new contest
exports.createContest = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      website,
      clientName,
      clientEmail,
      clientPassword,
      clientPhone,
      clientManagers,
    } = req.body;
    if (!name || !clientEmail) {
      return res.status(400).json({
        success: false,
        message: "Contest name and client email are required",
      });
    }

    // ==============================
    // 1️⃣ Generate Slug (NO LOOP)
    // ==============================
    const baseSlug = slugify(name, { lower: true, strict: true });
    const uniqueSuffix = Date.now(); // fast + unique
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // ==============================
    // 2️⃣ Check Client (Single Query)
    // ==============================
    let clientUser = await User.findOne({ email: clientEmail }).select(
      "_id email",
    );
    let isNewUser = false;

    if (!clientUser) {
      if (!clientPassword) {
        return res.status(400).json({
          success: false,
          message: "Password is required for new client",
        });
      }

      const hashedPassword = await bcrypt.hash(clientPassword, 10);

      clientUser = await User.create({
        name: clientName,
        email: clientEmail,
        password: hashedPassword,
        phone: clientPhone,
        role: "client",
      });

      isNewUser = true;
    }

    // ==============================
    // 3️⃣ Create Contest
    // ==============================

    let contestLogo = logo;
    if (req.files && req.files["contestlogo"] && req.files["contestlogo"][0]) {
      contestLogo = `/uploads/contest/${req.files["contestlogo"][0].filename}`;
    }

    const contest = await Contest.create({
      name,
      slug,
      description,
      logo: contestLogo,
      website,
      clientId: clientUser._id,
      clientManagers,
    });

    const contestLink = `${process.env.FRONTEND_URL}/contest/${slug}`;

    // ==============================
    // 4️⃣ Send Email (ASYNC - NON BLOCKING)
    // ==============================
    const sendEmail = async () => {
      try {
        const emailHtml = `
    <div style="background:#f3f4f6;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 15px 35px rgba(0,0,0,0.08);">

        <div style="background:linear-gradient(135deg,#4f46e5,#2563eb);padding:30px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;">Scan To Vote</h1>
          <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">
            Contest Management Platform
          </p>
        </div>

        <div style="padding:40px 30px;color:#374151;">
          <h2 style="margin-top:0;font-size:22px;color:#111827;">
            ${isNewUser ? "Welcome to the Platform 🎉" : "New Contest Added 🎉"}
          </h2>

          <p style="font-size:15px;line-height:1.7;color:#4b5563;">
            ${
              isNewUser
                ? `Your account has been successfully created for contest ${name} and your contest is now live.`
                : `${name} has been successfully added to your existing account.`
            }
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:30px 0;">
            <p style="margin:0 0 10px;font-size:14px;color:#6b7280;">Account Details</p>
            <p style="margin:4px 0;font-size:15px;">
              <strong>Email:</strong> ${clientEmail}
            </p>
            ${
              isNewUser
                ? `<p style="margin:4px 0;font-size:15px;">
                     <strong>Password:</strong> ${clientPassword}
                   </p>`
                : `<p style="margin:4px 0;font-size:14px;color:#6b7280;">
                     Use your existing password to login.
                   </p>`
            }
          </div>

          <div style="text-align:center;margin-top:30px;">
            <a href="${contestLink}"
              style="
                display:inline-block;
                padding:14px 28px;
                background:#4f46e5;
                color:#ffffff;
                font-size:15px;
                font-weight:bold;
                text-decoration:none;
                border-radius:8px;
                box-shadow:0 8px 18px rgba(79,70,229,0.3);
              ">
              View Your Contest
            </a>
          </div>

          <p style="margin-top:30px;font-size:13px;color:#6b7280;line-height:1.6;">
            For security reasons, we recommend changing your password after logging in.
            If you did not expect this email, please contact support immediately.
          </p>
        </div>

        <div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;">
          © ${new Date().getFullYear()} Scan To Vote. All rights reserved.
          <br/>
          This is an automated email. Please do not reply.
        </div>

      </div>
    </div>
    `;

        await transporter.sendMail({
          from: `"Scan To Vote" <${process.env.SMTP_EMAIL}>`,
          to: clientEmail,
          subject: isNewUser
            ? "🎉 Your Account & Contest Created"
            : "🎉 New Contest Added to Your Account",
          html: emailHtml,
        });
      } catch (err) {
        console.error("Email error:", err.message);
      }
    };

    sendEmail(); // ❗ not awaited (background)

    // ==============================
    // 5️⃣ Respond Immediately
    // ==============================
    return res.status(201).json({
      success: true,
      message: isNewUser
        ? "Client and contest created successfully"
        : "Contest created successfully for existing client",
      data: contest,
    });
  } catch (error) {
    console.error("Error in createContest:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get all Contests
exports.getAllContests = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { status, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const result = await Contest.aggregate([
      { $match: query },

      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },

            {
              $lookup: {
                from: "users", // collection name in MongoDB
                localField: "clientId",
                foreignField: "_id",
                as: "client",
              },
            },
            { $unwind: "$client" },

            {
              $project: {
                name: 1,
                slug: 1,
                status: 1,
                totalSeasons: 1,
                totalParticipants: 1,
                totalVotes: 1,
                createdAt: 1,
                "client._id": 1,
                "client.name": 1,
                "client.email": 1,
                "client.phone":1,
                "client.profile":1,
              },
            },
          ],

          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const contests = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: contests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get contest by Id
exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("clientId", "name email");

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get contest by Slug
exports.getContestBySlug = async (req, res) => {
  try {
    const contest = await Contest.findOne({
      slug: req.params.slug,
      isDeleted: false,
    }).populate("clientId", "name email");

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update a contest
exports.updateContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // Only owner can update
    if (contest.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updatedContest = await Contest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Contest updated successfully",
      data: updatedContest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete contest
exports.deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    if (contest.logo) {
      const logoPath = path.join(__dirname, "..", contest.logo);
      fs.unlink(logoPath, (err) => {
        if (err) {
          console.log("Logo delete error:", err.message);
        }
      });
    }

    // ❌ Permanently delete from DB
    await Contest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Contest permanently deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// change contest status
exports.changeContestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: contest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
