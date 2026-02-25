require('dotenv').config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for file upload
const upload = multer({ dest: uploadsDir });

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

  // Configure Gmail SMTP with timeout settings
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Changed from 465 to 587 for better compatibility
    secure: false, // Use STARTTLS instead of SSL
    auth: {
      user: process.env.GMAIL_USER || 'empoweredai3@gmail.com',
      pass: process.env.GMAIL_PASSWORD || 'ktcv bbgt yxab tbyy',
    },
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
  });

  try {
    console.log("Attempting to send email for file:", req.file.originalname);
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

    console.log("Email sent successfully for file:", req.file.originalname);

    // Delete file after sending
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.send("✅ File uploaded and email sent successfully!");
  } catch (err) {
    console.error("Upload error:", err.message);
    // Try to clean up file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error("Error deleting file:", unlinkErr);
      }
    }
    
    // Provide specific error messages
    if (err.message.includes("ENOTFOUND") || err.message.includes("timeout")) {
      res.status(503).send("Email service temporarily unavailable. File still received. Retry in a moment.");
    } else if (err.message.includes("Invalid login")) {
      res.status(500).send("Email authentication failed. Please check credentials.");
    } else {
      res.status(500).send("Error: " + err.message);
    }
  }
});

app.listen(5000, () =>
  console.log("🚀 Server running on http://localhost:5000")
);

