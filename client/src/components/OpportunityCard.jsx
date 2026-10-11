export default function OpportunityCard({
  opp,
  interested,
  onToggleInterest,
  onApply,
  isApplied
}) {
  const isEligible = Boolean(opp.eligible && opp.eligibilityStatus !== "Not Eligible");
  const status = isEligible ? "Eligible" : "Not Eligible";

  const getStatusBadgeClass = () => (isEligible ? "badge-eligible" : "badge-ineligible");
  const getCardBorderClass = () => (isEligible ? "border-eligible" : "border-ineligible");

  const workModeText = opp.workModes?.length
    ? opp.workModes.join(", ")
    : opp.remote
    ? "Online"
    : "Offline";

  const reqSkills = opp.requiredSkills || [];
  const matchingSkills = opp.matchingSkills || (opp.matchedSkills ? opp.matchedSkills.map((m) => m.skill || m) : []);
  const missingSkills = opp.missingSkills || [];
  const ineligibleReasons = opp.ineligibleReasons || (opp.failures ? opp.failures.map((f) => f.message) : []);

  const hasApplied = isApplied || opp.hasApplied;

  return (
    <article className={`opp ${getCardBorderClass()}`} aria-label={opp.title}>
      <div className="opp-head">
        <div>
          <h3>
            {opp.rank ? `Rank ${opp.rank}: ` : ""}
            {opp.title}
          </h3>
          <div className="opp-meta">
            🏢 {opp.company} | 📍 {opp.location} | 💼 Work Mode: {workModeText}
            {opp.salary ? ` | 💰 ₹${Number(opp.salary).toLocaleString()}/yr` : ""}
            {opp.shift ? ` | ⏱️ Shift: ${opp.shift}` : ""}
            {` | 👥 Applicants: ${opp.applicantsCount ?? opp.applicants?.length ?? 0}`}
          </div>
          <div className="status-badge-container">
            <span className={`status-pill ${getStatusBadgeClass()}`}>
              {status}
            </span>
            {hasApplied && (
              <span className="btn-applied" style={{ padding: "0.2rem 0.6rem", fontSize: "0.82rem", marginLeft: "0.4rem" }}>
                ✓ Applied
              </span>
            )}
          </div>
        </div>

        {isEligible && opp.score !== undefined && (
          <div className="score">
            {opp.score}
            <small>Rank Score</small>
          </div>
        )}
      </div>

      {/* Breakdown Pills for Gate 2 Master Ranking Formula */}
      {isEligible && opp.breakdown && (
        <div className="breakdown-row">
          <span className="breakdown-pill">
            Skill Score: <strong>{opp.breakdown.skill}%</strong>
          </span>
          <span className="breakdown-pill">
            Salary Fit: <strong>{opp.breakdown.salary}%</strong>
          </span>
          <span className="breakdown-pill">
            Distance Fit: <strong>{opp.breakdown.distance}%</strong>
          </span>
          <span className="breakdown-pill">
            Mode/Shift: <strong>{opp.breakdown.modeShift ?? opp.breakdown.mode}%</strong>
          </span>
        </div>
      )}

      {/* When NOT ELIGIBLE: do not do skill mapping, give reasons why not eligible */}
      {!isEligible && (
        <div className="explanation-section">
          <strong className="explanation-title">Why Am I Not Eligible?</strong>
          <ul className="explanation-list fail-list">
            {(ineligibleReasons.length > 0
              ? ineligibleReasons
              : ["You do not meet the mandatory criteria required for this opportunity."]
            ).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Required Skills for Opportunity */}
      {isEligible && reqSkills.length > 0 && (
        <div className="explanation-section">
          <strong className="explanation-title">Required Skills:</strong>
          <div className="chips" style={{ marginTop: "0.4rem" }}>
            {reqSkills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="opp-card-footer" style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "1rem" }}>
        {/* Apply Button for Eligible Seekers */}
        {isEligible && (
          hasApplied ? (
            <span className="btn-applied">✓ Applied</span>
          ) : (
            <button
              type="button"
              className="btn-apply"
              onClick={() => onApply && onApply(opp.id)}
            >
              Apply Now
            </button>
          )
        )}

        {onToggleInterest && (
          <button
            type="button"
            className={`btn ${interested ? "on" : ""}`}
            aria-pressed={interested}
            onClick={() => onToggleInterest(opp.id)}
          >
            {interested ? "Interested (Saved to Skill Gaps)" : "Mark as Interested"}
          </button>
        )}
      </div>
    </article>
  );
}
