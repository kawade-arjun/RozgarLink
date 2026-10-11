export default function SkillGapPanel({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return (
      <section className="panel" aria-label="Skill gap analysis">
        <h2>Skill Gap Analysis</h2>
        <p className="muted">
          Mark an opportunity as interested to view your skill coverage, matched skills, missing skills,
          and tailored learning recommendations.
        </p>
      </section>
    );
  }

  return (
    <section className="panel stack" aria-label="Skill gap analysis">
      <h2>Skill Gap Analysis for Your Interests</h2>

      {gaps.map((g) => {
        const totalReq = g.totalRequired ?? (g.requiredSkills?.length || 0);
        const matched = g.matchedSkills || [];
        const missing = g.missingSkills || [];
        const coverage = g.skillCoverage ?? (
          totalReq > 0 ? Math.round((matched.length / totalReq) * 100) : 100
        );

        const steps = g.pathway?.steps || [];
        const notInCatalogue = g.pathway?.notInCatalogue || [];

        return (
          <div className="gap" key={g.opportunityId}>
            <div className="gap-header">
              <div>
                <h3>{g.title}</h3>
                {g.company && <div className="muted">{g.company}</div>}
              </div>
              <div className="coverage-badge-container">
                <span className={`coverage-badge ${coverage >= 80 ? "high" : coverage >= 50 ? "med" : "low"}`}>
                  Skill Coverage: <strong>{coverage}%</strong>
                </span>
              </div>
            </div>

            <div className="coverage-bar-track" title={`Skill Coverage: ${coverage}%`}>
              <div
                className={`coverage-bar-fill ${coverage >= 80 ? "high" : coverage >= 50 ? "med" : "low"}`}
                style={{ width: `${coverage}%` }}
              />
            </div>

            {/* Explanation of how skill gap affects matching */}
            <div className="gap-impact-note">
              {coverage === 100 ? (
                <p className="skills-complete-note">
                  You possess 100% of the required skills for this position. Your skill match strongly supports your application.
                </p>
              ) : (
                <p className="muted">
                  You currently match {matched.length} of {totalReq} required skills ({coverage}% coverage).
                  Closing the {missing.length} missing skill gap{missing.length > 1 ? "s" : ""} will improve your match score and candidacy.
                </p>
              )}
            </div>

            {/* 3. Required Skills */}
            {g.requiredSkills && g.requiredSkills.length > 0 && (
              <div className="skills-group">
                <strong className="skills-group-title">Required Skills:</strong>
                <div className="chips">
                  {g.requiredSkills.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Matched Skills */}
            {matched.length > 0 && (
              <div className="skills-group">
                <strong className="skills-group-title">Matched Skills ({matched.length}):</strong>
                <div className="chips">
                  {matched.map((s) => (
                    <span key={s} className="chip have">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Missing Skills */}
            {missing.length > 0 && (
              <div className="skills-group">
                <strong className="skills-group-title">Missing Skills ({missing.length}):</strong>
                <div className="chips">
                  {missing.map((s) => (
                    <span key={s} className="chip miss">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Relevant Learning Recommendations */}
            {steps.length > 0 && (
              <div className="pathway-group">
                <strong>Recommended Learning Courses (Offline Catalogue, {g.pathway.totalHours}h total)</strong>
                <ol className="steps">
                  {steps.map((s) => (
                    <li key={s.id || s.step}>
                      <strong>{s.title}</strong>
                      <span className="muted">
                        {" "}(Level: {s.level}, {s.hours} hours - {s.reason})
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Missing courses in offline catalogue */}
            {notInCatalogue.length > 0 && (
              <div className="not-in-catalogue-list stack">
                {notInCatalogue.map((skill) => (
                  <p key={skill} className="muted not-in-catalogue">
                    {skill} is a skill gap for this opportunity. No matching course is currently available in the offline catalogue.
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
