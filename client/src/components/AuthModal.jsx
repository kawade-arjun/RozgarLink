import { useState } from "react";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("candidate"); // "candidate" | "recruiter"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg("");
    setStatusMsg("");
    setOtpSent(false);
    setOtp("");
  };

  const handleSendOtp = async (purpose) => {
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address first.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      setOtpSent(true);
      setStatusMsg(`OTP has been sent to ${email}. Please check your email inbox.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg("Name is required.");
    if (!email.trim()) return setErrorMsg("Email is required.");
    if (!password || password.length < 6) return setErrorMsg("Password must be at least 6 characters.");
    if (!otp.trim()) return setErrorMsg("Please enter the 6-digit OTP code sent to your email.");

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          otp: otp.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return setErrorMsg("Please provide both email and password.");
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setErrorMsg("Email is required.");
    if (!otp.trim()) return setErrorMsg("Please enter the OTP sent to your email.");
    if (!newPassword || newPassword.length < 6) return setErrorMsg("New password must be at least 6 characters.");

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }
      setStatusMsg("Password updated successfully! Please log in.");
      setTimeout(() => {
        setMode("login");
        resetFormState();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="auth-tabs">
            {mode !== "forgot" ? (
              <>
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
                  onClick={() => { setMode("login"); resetFormState(); }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
                  onClick={() => { setMode("signup"); resetFormState(); }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <h3 style={{ margin: 0 }}>Reset Password</h3>
            )}
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
          {statusMsg && <div className="auth-alert success">{statusMsg}</div>}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label>Password</label>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setMode("forgot"); resetFormState(); }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="auth-form">
              <div className="field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="field">
                <label>I am registering as</label>
                <div className="role-selector">
                  <label className={`role-pill ${role === "candidate" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={role === "candidate"}
                      onChange={() => setRole("candidate")}
                    />
                    <span>Job Seeker / Candidate</span>
                  </label>
                  <label className={`role-pill ${role === "recruiter" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={role === "recruiter"}
                      onChange={() => setRole("recruiter")}
                    />
                    <span>Recruiter / Employer</span>
                  </label>
                </div>
              </div>

              <div className="field">
                <label>Email Address</label>
                <div className="input-with-button">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={loading || !email.includes("@")}
                    onClick={() => handleSendOtp("signup")}
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
                <small>We will send a 6-digit OTP to verify your email.</small>
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
                <label>Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up & Verify"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="field">
                <label>Registered Email Address</label>
                <div className="input-with-button">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={loading || !email.includes("@")}
                    onClick={() => handleSendOtp("reset-password")}
                  >
                    {otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Verification OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="Enter 6-digit OTP"
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
                  placeholder="Enter new password (min 6 chars)"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => { setMode("login"); resetFormState(); }}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
