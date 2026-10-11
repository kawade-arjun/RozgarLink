const mongoose = require("mongoose");

const EducationSchema = new mongoose.Schema(
  {
    id: { type: String },
    level: { type: String, default: "" },
    degree: { type: String, default: "" },
    institution: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    status: { type: String, default: "completed" },
    passingYear: { type: mongoose.Schema.Types.Mixed, default: null },
    expectedGraduationYear: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    filename: { type: String },
    originalName: { type: String },
    size: { type: Number },
    uploadedAt: { type: String }
  },
  { _id: false }
);

const CandidateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    willingToRelocate: { type: Boolean, default: false },
    preferredWorkModes: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    education: { type: [EducationSchema], default: [] },
    qualification: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    interestedOpportunityIds: { type: [String], default: [] },
    appliedOpportunityIds: { type: [String], default: [] },
    expectedSalary: { type: Number, default: 400000 },
    maxCommuteKm: { type: Number, default: 25 },
    preferredShift: { type: String, default: "Flexible" },
    noticePeriodDays: { type: Number, default: 0 },
    resume: { type: ResumeSchema, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

CandidateSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

const Candidate = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema);

module.exports = Candidate;
