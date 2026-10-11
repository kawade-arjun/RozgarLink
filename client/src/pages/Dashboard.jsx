import OpportunityCard from "../components/OpportunityCard.jsx";
import SkillGapPanel from "../components/SkillGapPanel.jsx";

export default function Dashboard({
  result,
  loading,
  error,
  interestedIds,
  onToggleInterest,
  onGoToManage
}) {
  if (error) return <div className="panel note" role="alert">{error}</div>;
  if (!result) return <div className="panel">Loading…</div>;

  const totalOpps = (result.eligible?.length || 0) + (result.ineligible?.length || 0);

  // When no opportunities exist in the database at all
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
            onToggleInterest={onToggleInterest}
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
            onToggleInterest={onToggleInterest}
          />
        ))}
      </section>
    </div>
  );
}

