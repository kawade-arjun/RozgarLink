import { useState } from "react";
import OpportunityCard from "../components/OpportunityCard.jsx";
import SkillGapPanel from "../components/SkillGapPanel.jsx";
import SliderPanel from "../components/SliderPanel.jsx";

const CANDIDATE_SLIDERS = [
  { id: "u1", label: "Skills Weight", defaultVal: 70, desc: "Matches technical and verified skill capability" },
  { id: "u2", label: "Salary Weight", defaultVal: 10.5, desc: "Alignment with expected compensation (P_offer vs P_ask)" },
  { id: "u3", label: "Commute / Distance", defaultVal: 10.5, desc: "Travel radius & remote feasibility (D_job vs D_max)" },
  { id: "u4", label: "Work Mode / Shift", defaultVal: 9.0, desc: "Preferred shift & remote/hybrid compatibility" }
];

export default function Dashboard({
  result,
  loading,
  error,
  interestedIds,
  appliedIds = [],
  onToggleInterest,
  onApply,
  onGoToManage,
  weights,
  onWeightChange,
  onResetWeights
}) {
  const [showSliders, setShowSliders] = useState(false);

  if (error) return <div className="panel note" role="alert">{error}</div>;
  if (!result) return <div className="panel">Loading opportunities…</div>;

  const totalOpps = (result.eligible?.length || 0) + (result.ineligible?.length || 0);

  if (totalOpps === 0) {
    return (
      <div className="stack" aria-busy={loading}>
        <section className="panel stack empty-opportunities" aria-label="No opportunities">
          <h2>No opportunities posted yet</h2>
          <p className="muted">Opportunities will appear here once employers create postings.</p>
          {onGoToManage && (
            <div>
              <button type="button" className="btn on" onClick={onGoToManage}>
                Go to Recruiter Portal
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="stack" aria-busy={loading}>
      {/* Sleek Header Bar with Optional Match Weights Tuning */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Matching Opportunities</h2>
          <span className="muted" style={{ fontSize: "0.88rem" }}>
            {result.eligible.length} eligible · {result.ineligible.length} require additional criteria
          </span>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowSliders(!showSliders)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <span>⚙️</span>
          <span>{showSliders ? "Hide Priority Sliders" : "Adjust Weights"}</span>
        </button>
      </div>

      {showSliders && (
        <SliderPanel
          title="Ranking Priority Weights"
          subtitle="Customize importance for skills, salary, distance, and work mode."
          sliders={CANDIDATE_SLIDERS}
          values={weights || { u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 }}
          onChange={onWeightChange}
          onReset={onResetWeights}
        />
      )}

      {/* Eligible Opportunities */}
      <section className="stack">
        <div className="section-head">
          <h3 style={{ margin: 0 }}>Eligible ({result.eligible.length})</h3>
        </div>
        {result.eligible.length === 0 && (
          <p className="muted" style={{ padding: "0.5rem 0" }}>
            No opportunities currently match your criteria. Try updating your profile or skills.
          </p>
        )}
        {result.eligible.map((o) => (
          <OpportunityCard
            key={o.id}
            opp={o}
            interested={interestedIds.includes(o.id)}
            isApplied={appliedIds.includes(o.id) || o.hasApplied}
            onToggleInterest={onToggleInterest}
            onApply={onApply}
          />
        ))}
      </section>

      {/* Skill Gaps & Offline Learning */}
      <SkillGapPanel gaps={result.skillGaps} />

      {/* Ineligible Opportunities */}
      {result.ineligible.length > 0 && (
        <section className="stack">
          <div className="section-head">
            <h3 style={{ margin: 0, color: "var(--muted)" }}>Other Roles ({result.ineligible.length})</h3>
          </div>
          {result.ineligible.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              interested={interestedIds.includes(o.id)}
              isApplied={appliedIds.includes(o.id) || o.hasApplied}
              onToggleInterest={onToggleInterest}
              onApply={onApply}
            />
          ))}
        </section>
      )}
    </div>
  );
}
