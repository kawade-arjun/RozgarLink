import { useState, useEffect } from "react";
import SliderPanel from "./SliderPanel.jsx";

const RECRUITER_SLIDERS = [
  { id: "u1", label: "Slider 1: Candidate Competence", defaultVal: 70, desc: "Verified skills and qualifications" },
  { id: "u2", label: "Slider 2: Salary / Budget Fit", defaultVal: 10.5, desc: "Candidate expected salary vs role budget" },
  { id: "u3", label: "Slider 3: Location / Commute Fit", defaultVal: 10.5, desc: "Candidate commute radius & travel feasibility" },
  { id: "u4", label: "Slider 4: Availability / Notice", defaultVal: 9.0, desc: "Candidate notice period vs hiring timeline" }
];

export default function ApplicantShortlist({ opportunity, onClose }) {
  const [weights, setWeights] = useState({ u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 });
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplicants = async (currentWeights) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        u_competence: currentWeights.u1,
        u_salary: currentWeights.u2,
        u_commute: currentWeights.u3,
        u_availability: currentWeights.u4
      });
      const res = await fetch(`/api/opportunities/${opportunity.id}/applicants?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load applicants");
      const data = await res.json();
      setApplicants(data.applicants || []);
      setError("");
    } catch {
      setError("Failed to load applicants for this opportunity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants(weights);
  }, [opportunity.id, weights]);

  const handleSliderChange = (id, val) => {
    setWeights((prev) => ({ ...prev, [id]: val }));
  };

  const handleReset = () => {
    setWeights({ u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 });
  };

  return (
    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <div>
          <h3 style={{ margin: 0, color: "var(--accent)" }}>
            Applicant Shortlist: {opportunity.title} ({applicants.length})
          </h3>
          <p className="muted" style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem" }}>
            Perspective 2: Recruiter ranking applicants by competence (70%) and joining likelihood (30%).
          </p>
        </div>
        {onClose && (
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Close Applicants
          </button>
        )}
      </div>

      <SliderPanel
        title="Recruiter Ranking Controls (Applicant Feed)"
        subtitle="Perspective 2: Adjust sliders to dynamically re-rank candidates who applied."
        sliders={RECRUITER_SLIDERS}
        values={weights}
        onChange={handleSliderChange}
        onReset={handleReset}
      />

      {error && <div className="note">{error}</div>}

      {loading ? (
        <p className="muted">Loading and ranking applicants…</p>
      ) : applicants.length === 0 ? (
        <div className="empty-state" style={{ background: "#fbfbf9", borderRadius: "8px", padding: "1.5rem" }}>
          <p className="muted">No candidates have applied for this opportunity yet.</p>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
            Eligible job seekers can click "Apply Now" from their dashboard to appear in this shortlist.
          </p>
        </div>
      ) : (
        <div className="applicant-list stack">
          {applicants.map((app) => (
            <article key={app.id} className="applicant-card">
              <div className="applicant-head">
                <div>
                  <h4 style={{ margin: 0 }}>
                    Rank #{app.rank}: {app.name}
                  </h4>
                  <div className="opp-meta" style={{ marginTop: "0.2rem" }}>
                    {app.location || "Location not specified"} · {app.experienceYears || 0} yrs exp
                    {app.expectedSalary ? ` · Ask: ₹${Number(app.expectedSalary).toLocaleString()}/yr` : ""}
                    {app.noticePeriodDays !== undefined ? ` · Notice: ${app.noticePeriodDays} days` : ""}
                  </div>
                  <div style={{ marginTop: "0.3rem" }}>
                    <span className="badge ok">Status: {app.applicationStatus || "Applied"}</span>
                    {app.appliedAt && (
                      <span className="muted" style={{ fontSize: "0.78rem", marginLeft: "0.6rem" }}>
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="applicant-score">
                  {app.score}
                  <small style={{ fontSize: "0.72rem", color: "var(--muted)", display: "block" }}>
                    Fit Score
                  </small>
                </div>
              </div>

              {/* Breakdown Pills */}
              {app.breakdown && (
                <div className="breakdown-row">
                  <span className="breakdown-pill">
                    Competence: <strong>{app.breakdown.competence}%</strong>
                  </span>
                  <span className="breakdown-pill">
                    Budget Fit: <strong>{app.breakdown.salary}%</strong>
                  </span>
                  <span className="breakdown-pill">
                    Commute Fit: <strong>{app.breakdown.commute}%</strong>
                  </span>
                  <span className="breakdown-pill">
                    Availability: <strong>{app.breakdown.availability}%</strong>
                  </span>
                  <span className="breakdown-pill" style={{ background: "#e8f5e9" }}>
                    Joining Likelihood: <strong>{app.breakdown.joiningLikelihood}%</strong>
                  </span>
                </div>
              )}

              {/* Skills matched and missing */}
              <div className="chips">
                {(app.matchedSkills || []).map((m) => (
                  <span key={m.skill} className="chip have">
                    ✓ {m.skill} {m.type === "foundational" ? "(Foundational)" : ""}
                  </span>
                ))}
                {(app.missingSkills || []).map((s) => (
                  <span key={s} className="chip miss">
                    ✗ Missing: {s}
                  </span>
                ))}
              </div>

              {app.reason && (
                <p className="muted" style={{ fontSize: "0.82rem", margin: "0.4rem 0 0 0" }}>
                  {app.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
