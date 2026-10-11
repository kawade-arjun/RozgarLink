const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Candidate = require("../models/Candidate");

const router = express.Router();

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role }
 */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role = "candidate" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "usr-" + crypto.randomBytes(4).toString("hex");

    const newUser = await User.create({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      isVerified: true
    });

    // Check if candidate profile already exists for this email
    let candidateProfile = await Candidate.findOne({ email: cleanEmail });

    const userObj = newUser.toJSON ? newUser.toJSON() : newUser;
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        error: "No account found with this email. Please switch to 'Sign Up' to create an account."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
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
 * Body: { email, currentPassword, newPassword } or { email, newPassword }
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect current password." });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully!"
    });
  } catch (err) {
    console.error("Error in /reset-password:", err);
    res.status(500).json({ error: "Failed to update password. Please try again." });
  }
});

module.exports = router;
