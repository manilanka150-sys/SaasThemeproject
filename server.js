require('dotenv').config(); // MUST BE FIRST

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// ENV VARIABLES
// ==========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

// ==========================
// MongoDB Connection
// ==========================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });


// ==========================
// Nodemailer Setup
// ==========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify Email Config
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Email config error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

// ==========================
// User Schema
// ==========================
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  country: { type: String, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ==========================
// REGISTER
// ==========================
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, country, password } = req.body;

    if (!fullName || !email || !country || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      country,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: newUser._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      msg: 'Registration successful',
      token,
      userId: newUser._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==========================
// LOGIN
// ==========================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      msg: 'Login successful',
      token,
      userId: user._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==========================
// FORGOT PASSWORD
// ==========================
app.post('/api/forgot', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: 'Password reset successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// ==========================
// CONTACT (ADMIN + USER EMAIL WITH HEADER & FOOTER)
// ==========================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, query } = req.body;

    if (!name || !email || !query) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    const currentDate = new Date().toLocaleString();
    const currentYear = new Date().getFullYear();

    // Common Layout Styles
    const wrapper = `
      margin:0;
      padding:0;
      background:#f4f6f9;
      font-family:Arial, sans-serif;
    `;

    const container = `
      max-width:600px;
      margin:30px auto;
      background:#ffffff;
      border-radius:8px;
      overflow:hidden;
      box-shadow:0 5px 15px rgba(0,0,0,0.08);
    `;

    const header = `
      background:#0d6efd;
      color:#ffffff;
      padding:20px;
      text-align:center;
    `;

    const footer = `
      background:#f1f1f1;
      text-align:center;
      padding:15px;
      font-size:12px;
      color:#666;
    `;

    // ==========================
    // 1️⃣ SEND EMAIL TO ADMIN
    // ==========================
    await transporter.sendMail({
      from: `"Cloud SaaS" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: "📩 New Contact Message - Cloud SaaS",
      html: `
        <div style="${wrapper}">
          <div style="${container}">

            <!-- HEADER -->
            <div style="${header}">
              <h2 style="margin:0;">Cloud SaaS Platform</h2>
              <p style="margin:5px 0 0;">New Contact Inquiry</p>
            </div>

            <!-- BODY -->
            <div style="padding:25px; color:#333;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>

              <p><strong>Message:</strong></p>
              <div style="background:#f8f9fa; padding:12px; border-radius:5px;">
                ${query}
              </div>

              <p style="margin-top:20px; font-size:12px; color:#777;">
                Received on ${currentDate}
              </p>
            </div>

            <!-- FOOTER -->
            <div style="${footer}">
              © ${currentYear} Cloud SaaS. All rights reserved.
              <br/>
              Admin Notification Email
            </div>

          </div>
        </div>
      `
    });

    // ==========================
    // 2️⃣ SEND CONFIRMATION TO USER
    // ==========================
    await transporter.sendMail({
      from: `"Cloud SaaS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ We Received Your Message - Cloud SaaS",
      html: `
        <div style="${wrapper}">
          <div style="${container}">

            <!-- HEADER -->
            <div style="${header}">
              <h2 style="margin:0;">Cloud SaaS Support</h2>
              <p style="margin:5px 0 0;">Thank You For Contacting Us</p>
            </div>

            <!-- BODY -->
            <div style="padding:25px; color:#333;">
              <p>Hi ${name},</p>
              <p>Thank you for reaching out to us.</p>
              <p>We’ve received your message and our team will respond within 24 hours.</p>

              <h4>Your Message:</h4>
              <div style="background:#f8f9fa; padding:12px; border-radius:5px;">
                ${query}
              </div>

              <p style="margin-top:20px;">
                Best regards,<br/>
                <strong>Cloud SaaS Team</strong>
              </p>
            </div>

            <!-- FOOTER -->
            <div style="${footer}">
              © ${currentYear} Cloud SaaS.
              <br/>
              This is an automated confirmation email.
            </div>

          </div>
        </div>
      `
    });

    res.json({ msg: "Message sent successfully to admin and user" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Email sending failed" });
  }
});

// ==========================
app.listen(PORT, () => {
  console.log(`🚀... Server running on port ${PORT}`);
});
