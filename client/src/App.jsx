import { useEffect, useRef, useState } from "react";
import CandidateForm from "./components/CandidateForm.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ManageOpportunities from "./pages/ManageOpportunities.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

const createBlankCandidate = (user = null) => ({
  name: user?.name || "",
  email: user?.email || "",
  location: "",
  preferredWorkModes: ["Offline", "Online"],
  preferredLocations: [],
  education: [],
  qualification: "",
  experienceYears: 0,
  skills: [],
  certifications: [],
  interestedOpportunityIds: [],
  appliedOpportunityIds: [],
  expectedSalary: "",
  maxCommuteKm: 25,
  preferredShift: "Day",
  noticePeriodDays: 0
});

const DEFAULT_WEIGHTS = { u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 };

export default function App() {
  const [candidate, setCandidate] = useState(createBlankCandidate());
  const [qualifications, setQualifications] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // User Authentication & Settings State
  const [currentUser, setCurrentUser] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const reqId = useRef(0);

  const loadCandidateForUser = async (user) => {
    if (!user || user.role !== "candidate") {
      setCandidate(createBlankCandidate(user));
      return;
    }
    try {
      const res = await fetch(`/api/candidates/by-email/${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setCandidate({
          ...createBlankCandidate(user),
          ...data,
          name: data.name || user.name || "",
          email: user.email,
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          preferredLocations: data.preferredLocations || [],
          preferredWorkModes: data.preferredWorkModes || ["Offline", "Online"]
        });
      } else {
        // Fresh blank record for new candidate user
        setCandidate(createBlankCandidate(user));
      }
    } catch {
      setCandidate(createBlankCandidate(user));
    }
  };

  // Check stored session + fetch qualification list
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("rozgarlink.user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        if (parsed.role === "candidate") {
          loadCandidateForUser(parsed);
        }
      }
    } catch {}

    fetch("/api/meta")
      .then((r) => r.json())
      .then((meta) => {
        setQualifications(meta.qualifications || []);
      })
      .catch(() => setError("Cannot reach the server. Is it running on port 5000?"));
  }, []);

  // REAL-TIME: re-runs eligibility + ranking (debounced 200ms) on candidate edit, opp refresh, or weights adjustment
  useEffect(() => {
    if (!currentUser || currentUser.role !== "candidate") return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate, weights })
        });
        const data = await res.json();
        if (id === reqId.current) {
          setResult(data);
          setError("");
        }
      } catch {
        if (id === reqId.current) {
          setError("Matching failed. Check that the server is running.");
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [candidate, refreshKey, weights, currentUser]);

  const toggleInterest = (oppId) =>
    setCandidate((c) => ({
      ...c,
      interestedOpportunityIds: (c.interestedOpportunityIds || []).includes(oppId)
        ? c.interestedOpportunityIds.filter((x) => x !== oppId)
        : [...(c.interestedOpportunityIds || []), oppId]
    }));

  const handleApply = async (oppId) => {
    let currentCandidate = candidate;
    if (currentCandidate.id) {
      try {
        await fetch(`/api/candidates/${currentCandidate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentCandidate)
        });
      } catch {}
    } else {
      if (!currentCandidate.name || !currentCandidate.location) {
        alert("Please provide at least your Name and Current City before applying.");
        return;
      }
      try {
        const saveRes = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentCandidate)
        });
        if (!saveRes.ok) throw new Error("Could not save profile");
        currentCandidate = await saveRes.json();
        setCandidate(currentCandidate);
      } catch {
        alert("Could not save your profile before applying. Please try again.");
        return;
      }
    }

    try {
      const res = await fetch(`/api/opportunities/${oppId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: currentCandidate.id,
          candidateName: currentCandidate.name
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit application");
        return;
      }

      setCandidate((prev) => ({
        ...prev,
        appliedOpportunityIds: [...(prev.appliedOpportunityIds || []), oppId]
      }));
      setRefreshKey((k) => k + 1);
      alert("Application submitted successfully!");
    } catch {
      alert("Network error while submitting application.");
    }
  };

  const handleResetProfile = () => {
    setCandidate(createBlankCandidate(currentUser));
  };

  const handleWeightChange = (id, val) => {
    setWeights((prev) => ({ ...prev, [id]: val }));
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("rozgarlink.user", JSON.stringify(user));
    } catch {}

    if (user.role === "candidate") {
      loadCandidateForUser(user);
    } else {
      setCandidate(createBlankCandidate(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCandidate(createBlankCandidate());
    setResult(null);
    try {
      localStorage.removeItem("rozgarlink.user");
      localStorage.removeItem("rozgarlink.candidateId");
    } catch {}
  };

  return (
    <>
      <header className="app-header">
        <div className="header-top">
          <div className="header-brand">
            <h1>RozgarLink</h1>
          </div>

          <div className="header-right-corner">
            {currentUser ? (
              <>
                <div className="user-badge-pill">
                  <div className="user-avatar-circle">
                    {(currentUser.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="user-name-text">{currentUser.name}</span>
                  <span className="badge-role" style={{ marginLeft: "0.2rem", fontSize: "0.72rem" }}>
                    {currentUser.role === "recruiter" ? "Recruiter" : "Job Seeker"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-settings"
                  onClick={() => setIsSettingsOpen(true)}
                  title="Settings & Change Password"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {!currentUser ? (
        <main>
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </main>
      ) : currentUser.role === "candidate" ? (
        <main className="layout">
          <CandidateForm
            candidate={candidate}
            onChange={setCandidate}
            onResetProfile={handleResetProfile}
          />
          <Dashboard
            result={result}
            loading={loading}
            error={error}
            interestedIds={candidate.interestedOpportunityIds || []}
            appliedIds={candidate.appliedOpportunityIds || []}
            onToggleInterest={toggleInterest}
            onApply={handleApply}
            weights={weights}
            onWeightChange={handleWeightChange}
            onResetWeights={handleResetWeights}
          />
        </main>
      ) : (
        <main>
          <ManageOpportunities
            qualifications={qualifications}
            onOpportunitiesChanged={() => setRefreshKey((k) => k + 1)}
          />
        </main>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    </>
  );
}
