import { useState } from "react";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("candidate"); // "candidate" | "recruiter"
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg("");
    setStatusMsg("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg("Name is required.");
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
      if (!res.ok) throw new Error(data.error || "Signup failed");
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
    if (!email.trim() || !password) return setErrorMsg("Email and password are required.");

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onAuthSuccess(data.user);
      onClose();
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
                <label>Password</label>
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
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
