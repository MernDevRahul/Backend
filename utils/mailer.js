const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Optional: verify connection once at startup
transporter.verify((error, success) => {
  if (error) {
    console.log("Email Server Error:", error);
  } else {
    console.log("Email server is ready ✅");
  }
});

const sendMail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: `"Contest Platform" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = transporter;
