const crypto = require("crypto");
const { QUALIFICATION_LEVELS, mapEducationLevel, getCandidateHighestQualification } = require("../logic/eligibility");

function toCleanList(v) {
  if (Array.isArray(v)) {
    return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  }
  if (typeof v === "string") {
    return v.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function sanitizeEducation(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const status = String(e.status || "completed").toLowerCase() === "ongoing" ? "ongoing" : "completed";
      const passingYear =
        e.passingYear !== undefined && e.passingYear !== "" && e.passingYear !== null
          ? Number(e.passingYear)
          : "";
      const expectedGraduationYear =
        e.expectedGraduationYear !== undefined &&
        e.expectedGraduationYear !== "" &&
        e.expectedGraduationYear !== null
          ? Number(e.expectedGraduationYear)
          : "";

      return {
        id: String(e.id || crypto.randomUUID()),
        level: String(e.level || "Other").trim(),
        degree: String(e.degree || "").trim(),
        institution: String(e.institution || "").trim(),
        fieldOfStudy: String(e.fieldOfStudy || "").trim(),
        status,
        passingYear: isNaN(passingYear) ? "" : passingYear,
        expectedGraduationYear: isNaN(expectedGraduationYear) ? "" : expectedGraduationYear
      };
    })
    .filter(Boolean)
    .filter((e) => e.level || e.degree || e.institution);
}

function sanitize(p = {}) {
  let exp = p.experienceYears;
  if (exp === "" || exp === null || exp === undefined) {
    exp = 0;
  } else {
    exp = Number(exp);
  }

  const education = sanitizeEducation(p.education);

  // Derive highest qualification level from education, or preserve legacy
  let qualification = String(p.qualification || "").trim().toLowerCase();
  if (education.length > 0) {
    const { highestIdx } = getCandidateHighestQualification({ education, qualification });
    if (highestIdx >= 0 && highestIdx < QUALIFICATION_LEVELS.length) {
      qualification = QUALIFICATION_LEVELS[highestIdx];
    }
  }
  if (!qualification) qualification = "10th";

  // Preferred work modes: ["Offline", "Online"]
  let workModes = [];
  const rawModes = Array.isArray(p.preferredWorkModes)
    ? p.preferredWorkModes
    : typeof p.preferredWorkModes === "string"
    ? p.preferredWorkModes.split(",")
    : [];

  rawModes.forEach((w) => {
    const s = String(w ?? "").trim().toLowerCase();
    if (s === "offline") workModes.push("Offline");
    if (s === "online") workModes.push("Online");
  });
  workModes = [...new Set(workModes)];

  // Resume object
  let resume = null;
  if (p.resume && typeof p.resume === "object" && p.resume.filename) {
    resume = {
      filename: String(p.resume.filename).trim(),
      originalName: String(p.resume.originalName || p.resume.filename).trim(),
      size: Number(p.resume.size) || 0,
      uploadedAt: String(p.resume.uploadedAt || new Date().toISOString())
    };
  }

  const result = {
    name: String(p.name || "").trim(),
    location: String(p.location || "").trim(),
    willingToRelocate: p.willingToRelocate !== undefined ? Boolean(p.willingToRelocate) : true,
    preferredWorkModes: workModes,
    preferredLocations: toCleanList(p.preferredLocations),
    education,
    qualification,
    experienceYears: exp,
    skills: toCleanList(p.skills),
    certifications: toCleanList(p.certifications),
    interestedOpportunityIds: toCleanList(p.interestedOpportunityIds),
    appliedOpportunityIds: toCleanList(p.appliedOpportunityIds),
    expectedSalary: p.expectedSalary !== undefined && p.expectedSalary !== "" ? Number(p.expectedSalary) : 400000,
    maxCommuteKm: p.maxCommuteKm !== undefined && p.maxCommuteKm !== "" ? Number(p.maxCommuteKm) : 25,
    preferredShift: String(p.preferredShift || "Flexible").trim(),
    noticePeriodDays: p.noticePeriodDays !== undefined && p.noticePeriodDays !== "" ? Number(p.noticePeriodDays) : 0,
    resume
  };

  if (p.id) {
    result.id = String(p.id);
  }

  return result;
}

function validateCandidate(candidate) {
  if (!candidate.name) {
    return "Name is required";
  }
  if (!candidate.location) {
    return "Current city is required";
  }
  if (
    typeof candidate.experienceYears !== "number" ||
    isNaN(candidate.experienceYears) ||
    candidate.experienceYears < 0
  ) {
    return "Years of experience cannot be negative";
  }

  if (Array.isArray(candidate.education)) {
    for (const edu of candidate.education) {
      if (edu.status === "completed" && edu.passingYear !== "") {
        const y = Number(edu.passingYear);
        if (isNaN(y) || y < 1950 || y > 2100) {
          return "Passing year must be between 1950 and 2100";
        }
      }
      if (edu.status === "ongoing" && edu.expectedGraduationYear !== "") {
        const y = Number(edu.expectedGraduationYear);
        if (isNaN(y) || y < 1950 || y > 2100) {
          return "Expected graduation year must be between 1950 and 2100";
        }
      }
    }
  }

  return null;
}

module.exports = {
  sanitize,
  validateCandidate,
  toCleanList,
  sanitizeEducation
};

