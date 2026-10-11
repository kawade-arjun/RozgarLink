import { useState } from "react";

export default function SettingsModal({ isOpen, onClose, currentUser, onLogout }) {
  const [showResetSection, setShowResetSection] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSendResetOtp = async () => {
    if (!currentUser?.email) return;
    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, purpose: "reset-password" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset OTP");
      setOtpSent(true);
      setStatusMsg(`Verification code has been sent to ${currentUser.email}. Please check your email inbox.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return setErrorMsg("Please enter the verification OTP.");
    if (!newPassword || newPassword.length < 6) return setErrorMsg("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return setErrorMsg("Passwords do not match.");

    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setStatusMsg("Password updated successfully! Your account is secured.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowResetSection(false);
        setStatusMsg("");
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>⚙️</span>
            <h3 style={{ margin: 0 }}>Account Settings</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
          {statusMsg && <div className="auth-alert success">{statusMsg}</div>}

          {/* User profile summary */}
          <div className="settings-profile-card">
            <div className="settings-avatar">
              {(currentUser?.name || "U")[0].toUpperCase()}
            </div>
            <div className="settings-profile-info">
              <h4>{currentUser?.name || "User Profile"}</h4>
              <p className="settings-email">{currentUser?.email || "No email"}</p>
              <div className="settings-badges">
                <span className="badge badge-role">
                  {currentUser?.role === "recruiter" ? "Employer / Recruiter" : "Job Seeker / Candidate"}
                </span>
                <span className="badge badge-verified">✓ Verified</span>
              </div>
            </div>
          </div>

          <hr className="settings-divider" />

          {/* Password Reset Section */}
          <div className="settings-section">
            <div className="settings-section-head">
              <div>
                <h4 style={{ margin: 0 }}>Security & Password</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                  Change your password using email OTP verification.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setShowResetSection(!showResetSection);
                  setErrorMsg("");
                  setStatusMsg("");
                }}
              >
                {showResetSection ? "Cancel" : "Reset Password"}
              </button>
            </div>

            {showResetSection && (
              <form onSubmit={handleResetPassword} className="settings-reset-form">
                <p style={{ fontSize: "0.88rem", color: "var(--ink)" }}>
                  Click below to receive a 6-digit verification code to <strong>{currentUser?.email}</strong>.
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={loading}
                    onClick={handleSendResetOtp}
                  >
                    {otpSent ? "Resend OTP Code" : "Send OTP to My Email"}
                  </button>
                </div>

                <div className="field">
                  <label>Verification OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="Enter 6-digit OTP code"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="field">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className="field">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  disabled={loading}
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            )}
          </div>

          <hr className="settings-divider" />

          {/* Session Actions */}
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-outline-danger"
              style={{ width: "100%" }}
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
