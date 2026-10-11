import { useState } from "react";

export default function SettingsModal({ isOpen, onClose, currentUser, onLogout }) {
  const [showResetSection, setShowResetSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return setErrorMsg("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }

    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setStatusMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowResetSection(false);
        setStatusMsg("");
      }, 2000);
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
                <span className="badge badge-verified">✓ Active</span>
              </div>
            </div>
          </div>

          <hr className="settings-divider" />

          {/* Password Update Section */}
          <div className="settings-section">
            <div className="settings-section-head">
              <div>
                <h4 style={{ margin: 0 }}>Security</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                  Change your account password
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
                {showResetSection ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showResetSection && (
              <form onSubmit={handleUpdatePassword} className="settings-reset-form">
                <div className="field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
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
                  {loading ? "Updating..." : "Update Password"}
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
