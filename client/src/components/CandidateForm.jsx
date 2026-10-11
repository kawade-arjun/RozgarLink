import { useState } from "react";
import EducationSection from "./EducationSection.jsx";
import TagListInput from "./TagListInput.jsx";

export default function CandidateForm({
  candidate,
  onChange,
  onResetProfile
}) {
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const set = (patch) => {
    if (saveStatus === "saved") {
      setSaveStatus("idle");
    }
    onChange({ ...candidate, ...patch });
  };

  const isNameEmpty = !candidate.name || !candidate.name.trim();
  const isCityEmpty = !candidate.location || !candidate.location.trim();
  const isExpInvalid =
    candidate.experienceYears === "" ||
    typeof candidate.experienceYears !== "number" ||
    isNaN(candidate.experienceYears) ||
    candidate.experienceYears < 0;

  const isValid = !isNameEmpty && !isCityEmpty && !isExpInvalid;

  const toggleWorkMode = (mode) => {
    const current = candidate.preferredWorkModes || [];
    const exists = current.includes(mode);
    let next;
    if (exists) {
      next = current.filter((m) => m !== mode);
    } else {
      next = [...current, mode];
    }
    set({ preferredWorkModes: next });
  };

  const handleSave = async () => {
    if (!isValid || saveStatus === "saving") return;
    setSaveStatus("saving");
    setErrorMessage("");
    try {
      const isUpdate = Boolean(candidate.id);
      const url = isUpdate ? `/api/candidates/${candidate.id}` : "/api/candidates";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate)
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus("error");
        setErrorMessage(data.error || "Failed to save profile");
        return;
      }

      onChange(data);
      try {
        localStorage.setItem("rozgarlink.candidateId", data.id);
      } catch {}
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((curr) => (curr === "saved" ? "idle" : curr));
      }, 3000);
    } catch {
      setSaveStatus("error");
      setErrorMessage("Network error saving profile");
    }
  };

  return (
    <section className="panel stack" aria-label="Your profile">
      <div className="section-head">
        <h2>Your Profile</h2>
      </div>

      <div className="field">
        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          placeholder="e.g. Rahul Sharma"
          value={candidate.name || ""}
          onChange={(e) => set({ name: e.target.value })}
        />
        {isNameEmpty && <small className="field-error">Name is required.</small>}
      </div>

      <div className="field">
        <label htmlFor="location">Current City *</label>
        <input
          id="location"
          placeholder="e.g. Pune"
          value={candidate.location || ""}
          onChange={(e) => set({ location: e.target.value })}
        />
        {isCityEmpty && <small className="field-error">Current city is required.</small>}
      </div>

      <div className="field">
        <label>Preferred Work Mode</label>
        <div className="work-mode-options">
          <label className="checkbox-pill">
            <input
              type="checkbox"
              checked={(candidate.preferredWorkModes || []).includes("Offline")}
              onChange={() => toggleWorkMode("Offline")}
            />
            <span>Offline (On-site / In-office)</span>
          </label>
          <label className="checkbox-pill">
            <input
              type="checkbox"
              checked={(candidate.preferredWorkModes || []).includes("Online")}
              onChange={() => toggleWorkMode("Online")}
            />
            <span>Online (Remote / Work from home)</span>
          </label>
        </div>
        <small className="muted">
          Select either or both. Opportunities matching your preference are boosted during ranking.
        </small>
      </div>

      <TagListInput
        id="pref-locations"
        label="Preferred Cities"
        placeholder="e.g. Mumbai, Bangalore, Pune"
        items={candidate.preferredLocations || []}
        onChange={(locs) => set({ preferredLocations: locs })}
        helperText="Add preferred locations one by one. Used for preference ranking."
      />

      <EducationSection
        education={candidate.education || []}
        onChange={(edu) => set({ education: edu })}
      />

      <div className="field">
        <label htmlFor="exp">Years of Experience *</label>
        <input
          id="exp"
          type="number"
          min="0"
          step="0.5"
          value={candidate.experienceYears ?? 0}
          onChange={(e) =>
            set({ experienceYears: e.target.value === "" ? 0 : Number(e.target.value) })
          }
        />
        {isExpInvalid && <small className="field-error">Experience cannot be negative.</small>}
      </div>

      <TagListInput
        id="skills-input"
        label="Skills"
        placeholder="e.g. React, Python, JavaScript, HTML"
        items={candidate.skills || []}
        onChange={(skills) => set({ skills })}
        helperText="Add each skill you possess. Aliases like 'JS' and 'JavaScript' are normalized automatically."
        badgeType="have"
      />

      <TagListInput
        id="certs-input"
        label="Certifications"
        placeholder="e.g. AWS Certified Developer, ITI Electrician"
        items={candidate.certifications || []}
        onChange={(certs) => set({ certifications: certs })}
        helperText="Add formal certifications. Must match the exact title required by an opportunity."
        badgeType="cert"
      />

      {saveStatus === "error" && errorMessage && (
        <div className="note" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="button-group">
        <button
          type="button"
          className={`btn ${saveStatus === "saved" ? "btn-success" : "on"}`}
          onClick={handleSave}
          disabled={!isValid || saveStatus === "saving"}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
            ? "Profile Saved"
            : "Save Profile"}
        </button>

        <button
          type="button"
          className="btn"
          onClick={onResetProfile}
        >
          Start New Profile
        </button>
      </div>
    </section>
  );
}
