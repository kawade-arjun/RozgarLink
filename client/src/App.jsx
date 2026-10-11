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
  interestedOpportunityIds: [],
  appliedOpportunityIds: [],
  expectedSalary: 400000,
  maxCommuteKm: 25,
  preferredShift: "Flexible",
  noticePeriodDays: 0
};

const DEFAULT_WEIGHTS = { u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 };

export default function App() {
  const [candidate, setCandidate] = useState(EMPTY);
  const [qualifications, setQualifications] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("landing"); // "landing", "find", or "manage"
  const [refreshKey, setRefreshKey] = useState(0);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

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

  // REAL-TIME: re-runs eligibility + ranking (debounced 200ms) on candidate edit, opp refresh, or weights adjustment
  useEffect(() => {
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
  }, [candidate, refreshKey, weights]);

  const toggleInterest = (oppId) =>
    setCandidate((c) => ({
      ...c,
      interestedOpportunityIds: (c.interestedOpportunityIds || []).includes(oppId)
        ? c.interestedOpportunityIds.filter((x) => x !== oppId)
        : [...(c.interestedOpportunityIds || []), oppId]
    }));

  const handleApply = async (oppId) => {
    let currentCandidate = candidate;
    // Auto-save candidate profile if not yet stored with an ID in database
    if (!currentCandidate.id) {
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
        try {
          localStorage.setItem("rozgarlink.candidateId", currentCandidate.id);
        } catch {}
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
      alert("Application submitted successfully! The recruiter will see your profile in their applicant ranking feed.");
    } catch {
      alert("Network error while submitting application.");
    }
  };

  const handleResetProfile = () => {
    setCandidate(EMPTY);
    try {
      localStorage.removeItem("rozgarlink.candidateId");
    } catch {}
  };

  const handleWeightChange = (id, val) => {
    setWeights((prev) => ({ ...prev, [id]: val }));
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
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
            appliedIds={candidate.appliedOpportunityIds || []}
            onToggleInterest={toggleInterest}
            onApply={handleApply}
            onGoToManage={() => setActiveTab("manage")}
            weights={weights}
            onWeightChange={handleWeightChange}
            onResetWeights={handleResetWeights}
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
