const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer transport.
 * Reads EMAIL_USER and EMAIL_PASS from environment.
 */
function createTransporter() {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, "") : null;

  if (!user || !pass) {
    return null;
  }

  // For Gmail addresses, nodemailer's built-in "gmail" service is most reliable
  if (user.toLowerCase().endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass
      }
    });
  }

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

/**
 * Send an OTP email to the recipient.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - "signup" | "reset-password" | "login"
 * @returns {Promise<{ success: boolean }>}
 */
async function sendOTPEmail(to, otp, purpose = "signup") {
  const transporter = createTransporter();
  const purposeTitle =
    purpose === "reset-password"
      ? "Password Reset Request"
      : purpose === "login"
      ? "Login Verification Code"
      : "Email Verification Code";

  const messageText = `Your RozgarLink OTP for ${purposeTitle} is: ${otp}. This code is valid for 10 minutes. Please do not share it with anyone.`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">RozgarLink</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Smart Job & Skill Matching Platform</p>
      </div>
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
        <h3 style="color: #1e293b; margin: 0 0 12px 0;">${purposeTitle}</h3>
        <p style="color: #475569; font-size: 14px; margin-now 16px 0;">Use the 6-digit One-Time Password below to complete your action:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; background: #ffffff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">This OTP is valid for 10 minutes.</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        If you did not request this OTP, please ignore this email.
      </p>
    </div>
  `;

  if (!transporter) {
    console.error("[EMAIL ERROR] EMAIL_USER or EMAIL_PASS not set in environment.");
    throw new Error("Email service is not configured on the server.");
  }

  await transporter.sendMail({
    from: `"RozgarLink" <${process.env.EMAIL_USER.trim()}>`,
    to,
    subject: `[RozgarLink] Your OTP is ${otp} (${purposeTitle})`,
    text: messageText,
    html: htmlContent
  });

  console.log(`[EMAIL SENT] OTP successfully emailed to ${to}`);
  return { success: true };
}

module.exports = {
  createTransporter,
  sendOTPEmail
};
