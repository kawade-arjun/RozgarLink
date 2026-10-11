import { useState } from "react";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("candidate"); // "candidate" | "recruiter"
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const resetFormState = () => {
    setErrorMsg("");
    setStatusMsg("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg("Full Name is required.");
    if (!email.trim()) return setErrorMsg("Email is required.");
    if (!password || password.length < 6) return setErrorMsg("Password must be at least 6 characters.");

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
          role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return setErrorMsg("Please enter both email and password.");
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
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setErrorMsg("Email is required.");
    if (!newPassword || newPassword.length < 6) return setErrorMsg("New password must be at least 6 characters.");

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
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
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>RozgarLink</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in with your email and password"
              : mode === "signup"
              ? "Create your account to start matching opportunities"
              : "Set a new password for your account"}
          </p>

          {mode !== "forgot" && (
            <div className="auth-toggle-bar">
              <button
                type="button"
                className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => { setMode("login"); resetFormState(); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`auth-toggle-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => { setMode("signup"); resetFormState(); }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        <div className="auth-card-body">
          {errorMsg && (
            <div className="auth-alert error">
              <div>{errorMsg}</div>
              {errorMsg.toLowerCase().includes("no account found") && (
                <button
                  type="button"
                  className="link-btn"
                  style={{ marginTop: "0.4rem", display: "inline-block", color: "var(--accent)" }}
                  onClick={() => {
                    setMode("signup");
                    resetFormState();
                  }}
                >
                  👉 Switch to Sign Up
                </button>
              )}
            </div>
          )}
          {statusMsg && <div className="auth-alert success">{statusMsg}</div>}

          {/* LOGIN VIEW */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
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
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode("signup"); resetFormState(); }}
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP VIEW */}
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
                    <span>Job Seeker</span>
                  </label>
                  <label className={`role-pill ${role === "recruiter" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={role === "recruiter"}
                      onChange={() => setRole("recruiter")}
                    />
                    <span>Recruiter</span>
                  </label>
                </div>
              </div>

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
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account & Sign In"}
              </button>

              <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode("login"); resetFormState(); }}
                >
                  Log in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === "forgot" && (
            <form onSubmit={handleResetPassword} className="auth-form">
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
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
