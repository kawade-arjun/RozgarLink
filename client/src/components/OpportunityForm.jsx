import { useEffect, useState } from "react";
import TagListInput from "./TagListInput.jsx";

export default function OpportunityForm({
  opportunity,
  qualifications,
  onSaveSuccess,
  onCancel
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [workModes, setWorkModes] = useState(["Offline"]);
  const [minQualification, setMinQualification] = useState("10th");
  const [minExperienceYears, setMinExperienceYears] = useState(0);
  const [allowedLocations, setAllowedLocations] = useState([]);
  const [requiredCertifications, setRequiredCertifications] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [preferredSkills, setPreferredSkills] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title || "");
      setCompany(opportunity.company || "");
      setLocation(opportunity.location || "");
      const modes = opportunity.workModes || (opportunity.remote ? ["Online"] : ["Offline"]);
      setWorkModes(modes.length > 0 ? modes : ["Offline"]);
      setMinQualification(opportunity.criteria?.minQualification || "10th");
      setMinExperienceYears(opportunity.criteria?.minExperienceYears ?? 0);
      setAllowedLocations(opportunity.criteria?.allowedLocations || []);
      setRequiredCertifications(opportunity.criteria?.requiredCertifications || []);
      setRequiredSkills(opportunity.requiredSkills || []);
      setPreferredSkills(opportunity.preferredSkills || []);
    } else {
      setTitle("");
      setCompany("");
      setLocation("");
      setWorkModes(["Offline"]);
      setMinQualification(qualifications[0]?.value || "10th");
      setMinExperienceYears(0);
      setAllowedLocations([]);
      setRequiredCertifications([]);
      setRequiredSkills([]);
      setPreferredSkills([]);
    }
    setServerError("");
  }, [opportunity, qualifications]);

  const toggleWorkMode = (mode) => {
    const exists = workModes.includes(mode);
    let next;
    if (exists) {
      next = workModes.filter((m) => m !== mode);
    } else {
      next = [...workModes, mode];
    }
    setWorkModes(next);
  };

  const isTitleEmpty = !title.trim();
  const isCompanyEmpty = !company.trim();
  const isLocationEmpty = !location.trim();
  const isWorkModesEmpty = workModes.length === 0;
  const isMinQualInvalid =
    !minQualification || !qualifications.some((q) => q.value === minQualification);
  const isExpInvalid =
    minExperienceYears === "" ||
    typeof minExperienceYears !== "number" ||
    isNaN(minExperienceYears) ||
    minExperienceYears < 0;
  const isRequiredSkillsEmpty = requiredSkills.length === 0;

  const isValid =
    !isTitleEmpty &&
    !isCompanyEmpty &&
    !isLocationEmpty &&
    !isWorkModesEmpty &&
    !isMinQualInvalid &&
    !isExpInvalid &&
    !isRequiredSkillsEmpty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setServerError("");

    const isRemote = workModes.includes("Online") && !workModes.includes("Offline");

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      workModes,
      remote: isRemote,
      criteria: {
        minQualification,
        minExperienceYears: Number(minExperienceYears),
        allowedLocations: isRemote ? [] : allowedLocations,
        requiredCertifications
      },
      requiredSkills,
      preferredSkills
    };

    try {
      const isEditing = Boolean(opportunity?.id);
      const url = isEditing ? `/api/opportunities/${opportunity.id}` : "/api/opportunities";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to save opportunity");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (onSaveSuccess) onSaveSuccess(data);
    } catch {
      setServerError("Network error saving opportunity");
      setSubmitting(false);
    }
  };

  const isStrictlyOnline = workModes.includes("Online") && !workModes.includes("Offline");

  return (
    <form className="panel stack" onSubmit={handleSubmit} aria-label="Opportunity form">
      <h2>{opportunity ? "Edit Opportunity" : "Add Opportunity"}</h2>

      <div className="field">
        <label htmlFor="opp-title">Job Title *</label>
        <input
          id="opp-title"
          placeholder="e.g. Frontend Developer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {isTitleEmpty && <small className="field-error">Title is required.</small>}
      </div>

      <div className="field">
        <label htmlFor="opp-company">Company *</label>
        <input
          id="opp-company"
          placeholder="e.g. Acme Innovations"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        {isCompanyEmpty && <small className="field-error">Company is required.</small>}
      </div>

      <div className="field">
        <label htmlFor="opp-location">Location / City *</label>
        <input
          id="opp-location"
          placeholder="e.g. Pune"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        {isLocationEmpty && <small className="field-error">Location is required.</small>}
      </div>

      <div className="field">
        <label>Work Mode *</label>
        <div className="work-mode-options">
          <label className="checkbox-pill">
            <input
              type="checkbox"
              checked={workModes.includes("Offline")}
              onChange={() => toggleWorkMode("Offline")}
            />
            <span>Offline (On-site / In-office)</span>
          </label>
          <label className="checkbox-pill">
            <input
              type="checkbox"
              checked={workModes.includes("Online")}
              onChange={() => toggleWorkMode("Online")}
            />
            <span>Online (Remote / Work from home)</span>
          </label>
        </div>
        {isWorkModesEmpty ? (
          <small className="field-error">Select at least one work mode (Offline, Online, or both).</small>
        ) : (
          <small className="muted">
            Select either or both. Roles supporting both allow candidates in any mode.
          </small>
        )}
      </div>

      <fieldset className="criteria-fieldset stack">
        <legend>
          <strong>Eligibility Rules (Hard Filters)</strong>
        </legend>
        <p className="muted" style={{ margin: "0 0 0.5rem" }}>
          Candidates must satisfy all criteria below to be eligible for ranking.
        </p>

        <div className="field">
          <label htmlFor="opp-min-qual">Minimum Qualification *</label>
          <select
            id="opp-min-qual"
            value={minQualification}
            onChange={(e) => setMinQualification(e.target.value)}
          >
            {qualifications.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
          {isMinQualInvalid && <small className="field-error">Select a valid minimum qualification.</small>}
        </div>

        <div className="field">
          <label htmlFor="opp-min-exp">Minimum Years of Experience *</label>
          <input
            id="opp-min-exp"
            type="number"
            min="0"
            step="0.5"
            value={minExperienceYears}
            onChange={(e) =>
              setMinExperienceYears(e.target.value === "" ? 0 : Number(e.target.value))
            }
          />
          {isExpInvalid && <small className="field-error">Minimum experience cannot be negative.</small>}
        </div>

        <TagListInput
          id="opp-allowed-locs"
          label="Allowed Locations"
          placeholder="e.g. Pune, Mumbai, Bangalore"
          items={isStrictlyOnline ? [] : allowedLocations}
          onChange={(locs) => setAllowedLocations(locs)}
          helperText={
            isStrictlyOnline
              ? "Disabled for online-only roles (open to all locations)."
              : "Candidates in other cities who cannot relocate will be ineligible."
          }
        />

        <TagListInput
          id="opp-req-certs"
          label="Required Certifications"
          placeholder="e.g. ITI Electrician, AWS Certified"
          items={requiredCertifications}
          onChange={(certs) => setRequiredCertifications(certs)}
          helperText="Candidates without these certifications will be marked ineligible."
          badgeType="cert"
        />
      </fieldset>

      <TagListInput
        id="opp-req-skills"
        label="Required Skills *"
        placeholder="e.g. React, Python, JavaScript, SQL"
        items={requiredSkills}
        onChange={(skills) => setRequiredSkills(skills)}
        helperText="Required skills for this role. Used for skill gap analysis and eligibility."
        badgeType="have"
      />
      {isRequiredSkillsEmpty && (
        <small className="field-error">At least one required skill is required.</small>
      )}

      <TagListInput
        id="opp-pref-skills"
        label="Preferred Skills"
        placeholder="e.g. TypeScript, Git, Docker"
        items={preferredSkills}
        onChange={(skills) => setPreferredSkills(skills)}
        helperText="Used for ranking only. Never disqualifies a candidate."
      />

      {serverError && (
        <div className="note" role="alert">
          {serverError}
        </div>
      )}

      <div className="button-group">
        <button type="submit" className="btn on" disabled={!isValid || submitting}>
          {submitting
            ? "Saving..."
            : opportunity
            ? "Update Opportunity"
            : "Add Opportunity"}
        </button>

        {opportunity && (
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
