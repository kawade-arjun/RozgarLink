export default function LandingPage({ onSelectRole }) {
  return (
    <div className="landing-container">
      <div className="landing-hero">
        <span className="landing-tagline">AI-Powered Job &amp; Opportunity Matching</span>
        <h1 className="landing-title">Connect with Roles You Truly Qualify For</h1>
        <p className="landing-subtitle">
          RozgarLink combines transparent, rule-based eligibility checks with smart skill ranking
          and offline learning pathways. Choose how you would like to proceed:
        </p>
      </div>

      <div className="landing-grid">
        {/* Option A: Job Seeker */}
        <div className="landing-card job-seeker-card">
          <div className="card-badge">Candidates and Aspirants</div>
          <h2>Job Seeker</h2>
          <p>
            Build your comprehensive profile, specify your education and skills, define your
            preferred work modes (Online or Offline), and explore opportunities with instant eligibility verification.
          </p>
          <ul className="card-features">
            <li>Multi-record education and certifications</li>
            <li>Automatic skill coverage and gap analysis</li>
            <li>Tailored offline learning pathways</li>
          </ul>
          <button
            type="button"
            className="btn on landing-btn"
            onClick={() => onSelectRole("find")}
          >
            Find Opportunities
          </button>
        </div>

        {/* Option B: Recruiter */}
        <div className="landing-card recruiter-card">
          <div className="card-badge">Employers and Hiring Managers</div>
          <h2>Recruiter</h2>
          <p>
            Create and manage opportunity postings with strict eligibility criteria, required skillsets,
            preferred locations, and work-mode specifications.
          </p>
          <ul className="card-features">
            <li>Strict, rule-based applicant screening</li>
            <li>Explainable candidate ranking</li>
            <li>Real-time opportunity management</li>
          </ul>
          <button
            type="button"
            className="btn on landing-btn"
            onClick={() => onSelectRole("manage")}
          >
            Manage Opportunities
          </button>
        </div>
      </div>
    </div>
  );
}
