import { useEffect, useRef, useState } from "react";
import CandidateForm from "./components/CandidateForm.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ManageOpportunities from "./pages/ManageOpportunities.jsx";

const EMPTY = {
  name: "",
  location: "",
  preferredWorkModes: ["Offline", "Online"],
  preferredLocations: [],
  education: [],
  qualification: "12th",
  experienceYears: 0,
  skills: [],
  certifications: [],
  interestedOpportunityIds: []
};

export default function App() {
  const [candidate, setCandidate] = useState(EMPTY);
  const [qualifications, setQualifications] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("landing"); // "landing", "find", or "manage"
  const [refreshKey, setRefreshKey] = useState(0);

  const reqId = useRef(0);

  // Fetch qualification list + check localStorage for existing candidate
  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((meta) => {
        setQualifications(meta.qualifications || []);
      })
      .catch(() => setError("Cannot reach the server. Is it running on port 5000?"));

    let storedId = null;
    try {
      storedId = localStorage.getItem("rozgarlink.candidateId");
    } catch {
      // localStorage may be disabled
    }

    if (storedId) {
      fetch(`/api/candidates/${storedId}`)
        .then(async (res) => {
          if (res.status === 404) {
            try {
              localStorage.removeItem("rozgarlink.candidateId");
            } catch {}
            setCandidate(EMPTY);
            return;
          }
          if (res.ok) {
            const data = await res.json();
            setCandidate({
              ...EMPTY,
              ...data,
              preferredWorkModes: data.preferredWorkModes || ["Offline", "Online"],
              education: data.education || []
            });
          }
        })
        .catch(() => {
          // Keep empty if fetch fails
        });
    }
  }, []);

  // REAL-TIME: re-runs eligibility + ranking (debounced 200ms) on candidate edit or opp refresh
  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate })
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
  }, [candidate, refreshKey]);

  const toggleInterest = (oppId) =>
    setCandidate((c) => ({
      ...c,
      interestedOpportunityIds: (c.interestedOpportunityIds || []).includes(oppId)
        ? c.interestedOpportunityIds.filter((x) => x !== oppId)
        : [...(c.interestedOpportunityIds || []), oppId]
    }));

  const handleResetProfile = () => {
    setCandidate(EMPTY);
    try {
      localStorage.removeItem("rozgarlink.candidateId");
    } catch {}
  };

  return (
    <>
      <header className="app-header">
        <div className="header-top">
          <div
            className="header-brand"
            onClick={() => setActiveTab("landing")}
            style={{ cursor: "pointer" }}
            title="RozgarLink Home"
          >
            <h1>RozgarLink</h1>
            <p>Find opportunities you qualify for, see why they rank where they do, and know what to learn next.</p>
          </div>
          {activeTab !== "landing" && (
            <div className="header-actions">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setActiveTab("landing")}
              >
                Change Role
              </button>
            </div>
          )}
        </div>
      </header>

      {activeTab === "landing" && (
        <main>
          <LandingPage onSelectRole={(role) => setActiveTab(role)} />
        </main>
      )}

      {activeTab === "find" && (
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
            onToggleInterest={toggleInterest}
            onGoToManage={() => setActiveTab("manage")}
          />
        </main>
      )}

      {activeTab === "manage" && (
        <main>
          <ManageOpportunities
            qualifications={qualifications}
            onOpportunitiesChanged={() => setRefreshKey((k) => k + 1)}
          />
        </main>
      )}
    </>
  );
}

