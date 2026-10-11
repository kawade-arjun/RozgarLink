import { useState } from "react";

const EDUCATION_LEVEL_OPTIONS = [
  "10th / Secondary School",
  "12th / Higher Secondary",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Other"
];

function getLevelRank(level) {
  const norm = String(level || "").toLowerCase();
  if (norm.includes("10") || norm.includes("secondary school")) return 0;
  if (norm.includes("12") || norm.includes("higher secondary")) return 1;
  if (norm.includes("diploma")) return 2;
  if (norm.includes("bachelor")) return 3;
  if (norm.includes("master")) return 4;
  if (norm.includes("doctorate") || norm.includes("phd")) return 5;
  return 6; // Other
}

function sortEducationRecords(records) {
  return [...records].sort((a, b) => {
    const rankA = getLevelRank(a.level);
    const rankB = getLevelRank(b.level);
    if (rankA !== rankB) return rankA - rankB;
    const yearA = Number(a.status === "ongoing" ? a.expectedGraduationYear : a.passingYear) || 0;
    const yearB = Number(b.status === "ongoing" ? b.expectedGraduationYear : b.passingYear) || 0;
    return yearA - yearB;
  });
}

const BLANK_RECORD = {
  level: "Bachelor's Degree",
  institution: "",
  fieldOfStudy: "",
  status: "completed",
  passingYear: "",
  expectedGraduationYear: ""
};

export default function EducationSection({ education = [], onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(BLANK_RECORD);
  const [formError, setFormError] = useState("");

  const startAdd = () => {
    setFormData({ ...BLANK_RECORD });
    setFormError("");
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (record) => {
    setFormData({ ...record });
    setFormError("");
    setIsAdding(false);
    setEditingId(record.id);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormError("");
  };

  const validate = () => {
    if (!formData.institution.trim()) {
      return "Institution name is required.";
    }
    if (formData.status === "completed") {
      if (formData.passingYear !== "") {
        const y = Number(formData.passingYear);
        if (isNaN(y) || y < 1950 || y > 2100) {
          return "Please enter a valid passing year between 1950 and 2100.";
        }
      }
    } else {
      if (formData.expectedGraduationYear !== "") {
        const y = Number(formData.expectedGraduationYear);
        if (isNaN(y) || y < 1950 || y > 2100) {
          return "Please enter a valid expected graduation year between 1950 and 2100.";
        }
      }
    }
    return "";
  };

  const handleSave = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    const cleanRecord = {
      ...formData,
      institution: formData.institution.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      passingYear: formData.status === "completed" && formData.passingYear ? Number(formData.passingYear) : "",
      expectedGraduationYear:
        formData.status === "ongoing" && formData.expectedGraduationYear
          ? Number(formData.expectedGraduationYear)
          : ""
    };

    if (editingId) {
      onChange(education.map((item) => (item.id === editingId ? cleanRecord : item)));
      setEditingId(null);
    } else {
      const newRecord = {
        ...cleanRecord,
        id: crypto.randomUUID()
      };
      onChange([...education, newRecord]);
      setIsAdding(false);
    }
    setFormError("");
  };

  const handleRemove = (id) => {
    onChange(education.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const sortedRecords = sortEducationRecords(education);

  return (
    <div className="education-section stack">
      <div className="education-head">
        <div>
          <label><strong>Education</strong></label>
          <small className="muted" style={{ display: "block" }}>
            Add your degrees, schools, and academic records. Records are displayed in logical order from secondary to postgraduate.
          </small>
        </div>
        {!isAdding && !editingId && (
          <button type="button" className="btn btn-sm on" onClick={startAdd}>
            Add Education +
          </button>
        )}
      </div>

      {education.length === 0 && !isAdding && !editingId ? (
        <div className="education-empty">
          <p className="muted">No education records added yet. Add education details to satisfy eligibility requirements.</p>
        </div>
      ) : (
        <div className="education-list stack">
          {sortedRecords.map((record) => {
            if (editingId === record.id) return null;
            return (
              <div key={record.id} className="education-card">
                <div className="education-card-main">
                  <div className="education-card-top">
                    <span className="badge ok">{record.level}</span>
                    <span className={`status-badge ${record.status}`}>
                      {record.status === "completed" ? "Completed" : "Ongoing"}
                    </span>
                  </div>
                  <h4 className="education-degree">
                    {record.level}
                    {record.fieldOfStudy && <span className="education-field"> in {record.fieldOfStudy}</span>}
                  </h4>
                  <div className="education-institution">{record.institution}</div>
                  <div className="education-year muted">
                    {record.status === "completed"
                      ? record.passingYear ? `Passing Year: ${record.passingYear}` : "Completed"
                      : record.expectedGraduationYear ? `Expected Graduation: ${record.expectedGraduationYear}` : "Ongoing"}
                  </div>
                </div>
                <div className="education-card-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => startEdit(record)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemove(record.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isAdding || editingId) && (
        <form className="education-form stack" onSubmit={handleSave}>
          <div className="section-head">
            <h4>{editingId ? "Edit Education Record" : "Add Education Record"}</h4>
          </div>

          <div className="field">
            <label htmlFor="edu-level">Education Level</label>
            <select
              id="edu-level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            >
              {EDUCATION_LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edu-institution">Institution Name *</label>
            <input
              id="edu-institution"
              placeholder="e.g. Pune University, St. Xavier's High School"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="edu-field">Field of Study or Specialization</label>
            <input
              id="edu-field"
              placeholder="e.g. Computer Science, Mechanical, Commerce"
              value={formData.fieldOfStudy}
              onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Current Status</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="edu-status"
                  value="completed"
                  checked={formData.status === "completed"}
                  onChange={() => setFormData({ ...formData, status: "completed" })}
                />
                Completed
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="edu-status"
                  value="ongoing"
                  checked={formData.status === "ongoing"}
                  onChange={() => setFormData({ ...formData, status: "ongoing" })}
                />
                Ongoing
              </label>
            </div>
          </div>

          {formData.status === "completed" ? (
            <div className="field">
              <label htmlFor="edu-passing-year">Passing Year</label>
              <input
                id="edu-passing-year"
                type="number"
                min="1950"
                max="2100"
                placeholder="e.g. 2022"
                value={formData.passingYear}
                onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="edu-grad-year">Expected Graduation Year</label>
              <input
                id="edu-grad-year"
                type="number"
                min="1950"
                max="2100"
                placeholder="e.g. 2027"
                value={formData.expectedGraduationYear}
                onChange={(e) => setFormData({ ...formData, expectedGraduationYear: e.target.value })}
              />
            </div>
          )}

          {formError && <small className="field-error">{formError}</small>}

          <div className="button-group">
            <button type="submit" className="btn on">
              {editingId ? "Update Record" : "Save Record"}
            </button>
            <button type="button" className="btn" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
