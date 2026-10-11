const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const { sendOTPEmail } = require("../config/email");

const router = express.Router();

// In-memory cache for pending signups before account creation
const pendingSignups = new Map();

/**
 * Generate 6-digit numeric OTP string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/send-otp
 * Body: { email, purpose } (purpose: "signup" | "reset-password")
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { email, purpose = "signup" } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (purpose === "signup" && existingUser && existingUser.isVerified) {
      return res.status(400).json({
        error: "An account with this email already exists. Please switch to 'Log In' instead."
      });
    }

    if ((purpose === "reset-password" || purpose === "login-otp") && !existingUser) {
      return res.status(404).json({
        error: "No account found with this email address. Please switch to 'Sign Up' to create an account first."
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
      existingUser.otp = otp;
      existingUser.otpExpiresAt = expiresAt;
      await existingUser.save();
    } else {
      pendingSignups.set(cleanEmail, { otp, expiresAt });
    }

    await sendOTPEmail(cleanEmail, otp, purpose);

    res.json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}. Please check your email inbox.`
    });
  } catch (err) {
    console.error("Error in /send-otp:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role, otp }
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "candidate", otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: "Name, email, password, and OTP are all required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ error: "Email is already registered. Please log in." });
    }

    // Verify OTP
    let storedOtp = null;
    let storedExpiresAt = null;

    if (existingUser) {
      storedOtp = existingUser.otp;
      storedExpiresAt = existingUser.otpExpiresAt;
    } else if (pendingSignups.has(cleanEmail)) {
      const pending = pendingSignups.get(cleanEmail);
      storedOtp = pending.otp;
      storedExpiresAt = pending.expiresAt;
    }

    if (!storedOtp || storedOtp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP code. Please check and try again." });
    }

    if (new Date() > new Date(storedExpiresAt)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "usr-" + crypto.randomBytes(4).toString("hex");

    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.isVerified = true;
      existingUser.otp = null;
      existingUser.otpExpiresAt = null;
      await existingUser.save();
    } else {
      existingUser = await User.create({
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role,
        isVerified: true,
        otp: null,
        otpExpiresAt: null
      });
      pendingSignups.delete(cleanEmail);
    }

    // If candidate, associate or create a candidate profile
    let candidateProfile = await Candidate.findOne({ email: cleanEmail });
    if (!candidateProfile && role === "candidate") {
      candidateProfile = await Candidate.create({
        id: "cand-" + crypto.randomBytes(4).toString("hex"),
        name: name.trim(),
        email: cleanEmail,
        skills: [],
        qualification: "secondary",
        locations: ["Remote"],
        languages: ["English"],
        appliedOpportunityIds: []
      });
    }

    const userObj = existingUser.toJSON ? existingUser.toJSON() : existingUser;
    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: {
        ...userObj,
        profileId: candidateProfile ? candidateProfile.id : null
      }
    });
  } catch (err) {
    console.error("Error in /signup:", err);
    res.status(500).json({ error: "Failed to create account. Please try again." });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    if (!email || (!password && !otp)) {
      return res.status(400).json({ error: "Please enter your password or request an OTP code." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        error: "No account found with this email address. Please click 'Sign Up' to create an account first."
      });
    }

    if (otp) {
      if (!user.otp || user.otp !== String(otp).trim()) {
        return res.status(400).json({ error: "Invalid OTP code. Please check your email." });
      }
      if (new Date() > new Date(user.otpExpiresAt)) {
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }
      user.otp = null;
      user.otpExpiresAt = null;
      await user.save();
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password." });
      }
    }

    let candidateProfile = null;
    if (user.role === "candidate") {
      candidateProfile = await Candidate.findOne({ email: cleanEmail });
    }

    const userObj = user.toJSON();
    res.json({
      success: true,
      message: "Login successful!",
      user: {
        ...userObj,
        profileId: candidateProfile ? candidateProfile.id : null
      }
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    if (!user.otp || user.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP code." });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({
      success: true,
      message: "Password has been successfully reset! You can now log in with your new password."
    });
  } catch (err) {
    console.error("Error in /reset-password:", err);
    res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
});

module.exports = router;
