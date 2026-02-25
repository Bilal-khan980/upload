require('dotenv').config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

// Multer setup for file upload
const upload = multer({ dest: "uploads/" });

// Basic endpoint returning "hello"
app.get("/hello", (req, res) => {
  res.send("hello");
});

// Upload & Send Email
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("📂 Received /upload request");

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  // Configure Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    console.log(`📧 Sending email from ${process.env.EMAIL_USER}...`);
    await transporter.sendMail({
      from: `"File Upload Service" <${process.env.EMAIL_USER}>`,
      to: "matchmerchants224@gmail.com", // recipient
      subject: "New File Uploaded",
      text: `A new file has been uploaded: ${req.file.originalname}`,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path,
        },
      ],
    });

    // Delete file after sending
    fs.unlinkSync(req.file.path);

    res.send("Form submitted successfully!");
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).send(" Error submitting: " + err.message);
  }
});

app.listen(5000, () =>
  console.log("🚀 Server running on http://localhost:5000")
);

