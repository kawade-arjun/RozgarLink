import { useEffect, useState } from "react";
import OpportunityForm from "../components/OpportunityForm.jsx";
import ApplicantShortlist from "../components/ApplicantShortlist.jsx";

export default function ManageOpportunities({ qualifications, onOpportunitiesChanged }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingOpp, setEditingOpp] = useState(null);
  const [activeShortlistOppId, setActiveShortlistOppId] = useState(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/opportunities");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOpportunities(data);
      setError("");
    } catch {
      setError("Failed to load opportunities from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleSaveSuccess = () => {
    setEditingOpp(null);
    fetchOpportunities();
    if (onOpportunitiesChanged) onOpportunitiesChanged();
  };

  const handleDelete = async (opp) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${opp.title}" at ${opp.company}?`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, { method: "DELETE" });
      if (res.status === 204 || res.ok) {
        if (editingOpp?.id === opp.id) {
          setEditingOpp(null);
        }
        await fetchOpportunities();
        if (onOpportunitiesChanged) onOpportunitiesChanged();
      } else {
        alert("Failed to delete opportunity.");
      }
    } catch {
      alert("Network error while deleting opportunity.");
    }
  };

  return (
    <div className="layout">
      <div>
        <OpportunityForm
          opportunity={editingOpp}
          qualifications={qualifications}
          onSaveSuccess={handleSaveSuccess}
          onCancel={() => setEditingOpp(null)}
        />
      </div>

      <div className="stack">
        <section className="panel stack" aria-label="Existing opportunities">
          <div className="section-head">
            <h2>Saved Opportunities ({opportunities.length})</h2>
          </div>

          {error && <div className="note" role="alert">{error}</div>}

          {loading ? (
            <p className="muted">Loading opportunities…</p>
          ) : opportunities.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No opportunities yet. Add one to start matching.</p>
            </div>
          ) : (
            <div className="opp-list stack">
              {opportunities.map((opp) => (
                <article key={opp.id} className="opp opp-manage-card">
                  <div className="opp-head">
                    <div>
                      <h3>{opp.title}</h3>
                      <div className="opp-meta">
                        {opp.company} · {opp.location}
                        {opp.remote && <span className="badge ok" style={{ marginLeft: "0.5rem" }}>Remote</span>}
                      </div>
                    </div>
                    <div className="manage-actions">
                      <button
                        type="button"
                        className={`btn ${activeShortlistOppId === opp.id ? "on" : ""}`}
                        onClick={() =>
                          setActiveShortlistOppId(activeShortlistOppId === opp.id ? null : opp.id)
                        }
                      >
                        Applicants ({opp.applicants?.length || 0})
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setEditingOpp(opp);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(opp)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="criteria-summary">
                    <strong>Eligibility:</strong> Min {opp.criteria?.minQualification || "any"}, {opp.criteria?.minExperienceYears ?? 0}+ yrs exp
                    {opp.criteria?.allowedLocations?.length > 0 && ` · In ${opp.criteria.allowedLocations.join(", ")}`}
                    {opp.criteria?.requiredCertifications?.length > 0 && ` · Cert: ${opp.criteria.requiredCertifications.join(", ")}`}
                  </div>

                  <div className="chips">
                    {(opp.requiredSkills || []).map((s) => (
                      <span key={s} className="chip have">
                        Required: {s}
                      </span>
                    ))}
                    {(opp.preferredSkills || []).map((s) => (
                      <span key={s} className="chip" style={{ background: "#f0f2f5" }}>
                        Preferred: {s}
                      </span>
                    ))}
                  </div>

                  {activeShortlistOppId === opp.id && (
                    <ApplicantShortlist
                      opportunity={opp}
                      onClose={() => setActiveShortlistOppId(null)}
                    />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
