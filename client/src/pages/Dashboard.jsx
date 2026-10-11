import OpportunityCard from "../components/OpportunityCard.jsx";
import SkillGapPanel from "../components/SkillGapPanel.jsx";
import SliderPanel from "../components/SliderPanel.jsx";

const CANDIDATE_SLIDERS = [
  { id: "u1", label: "Slider 1: Skills Weight", defaultVal: 70, desc: "Matches technical and verified skill capability" },
  { id: "u2", label: "Slider 2: Salary Weight", defaultVal: 10.5, desc: "Alignment with expected compensation (P_offer vs P_ask)" },
  { id: "u3", label: "Slider 3: Commute / Distance", defaultVal: 10.5, desc: "Travel radius & remote feasibility (D_job vs D_max)" },
  { id: "u4", label: "Slider 4: Work Mode / Shift", defaultVal: 9.0, desc: "Preferred shift & remote/hybrid compatibility" }
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
  if (error) return <div className="panel note" role="alert">{error}</div>;
  if (!result) return <div className="panel">Loading…</div>;

  const totalOpps = (result.eligible?.length || 0) + (result.ineligible?.length || 0);

  if (totalOpps === 0) {
    return (
      <div className="stack" aria-busy={loading}>
        <section className="panel stack empty-opportunities" aria-label="No opportunities">
          <h2>No opportunities have been added yet</h2>
          <p className="muted">Add opportunities to start matching your profile against them.</p>
          {onGoToManage && (
            <div>
              <button type="button" className="btn on" onClick={onGoToManage}>
                Go to Manage Opportunities
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="stack" aria-busy={loading}>
      {/* Dynamic Ranking Sliders for Candidate (Perspective 1) */}
      <SliderPanel
        title="Candidate Dashboard: Dynamic Job Ranking Controls"
        subtitle="Perspective 1: Adjust sliders to dynamically re-rank eligible opportunities based on skills vs fit."
        sliders={CANDIDATE_SLIDERS}
        values={weights || { u1: 70, u2: 10.5, u3: 10.5, u4: 9.0 }}
        onChange={onWeightChange}
        onReset={onResetWeights}
      />

      <div className="recommendation" role="status">{result.recommendation}</div>

      <section className="stack">
        <h2>Opportunities you qualify for ({result.eligible.length})</h2>
        {result.eligible.length === 0 && (
          <p className="muted">None yet. Update your profile or check the conditions below.</p>
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

      <SkillGapPanel gaps={result.skillGaps} />

      <section className="stack">
        <h2>Not eligible ({result.ineligible.length})</h2>
        <p className="muted">These are never ranked, whatever your skills. Each shows the exact condition you did not meet.</p>
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
    </div>
  );
}
