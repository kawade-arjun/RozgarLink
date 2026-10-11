const mongoose = require("mongoose");

const CriteriaSchema = new mongoose.Schema(
  {
    minQualification: { type: String, default: "" },
    minExperienceYears: { type: Number, default: 0 },
    allowedLocations: { type: [String], default: [] },
    requiredCertifications: { type: [String], default: [] }
  },
  { _id: false }
);

const OpportunitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    workModes: { type: [String], default: [] },
    remote: { type: Boolean, default: false },
    criteria: { type: CriteriaSchema, default: () => ({}) },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    salary: { type: Number, default: 500000 },
    commuteDistanceKm: { type: Number, default: 15 },
    shift: { type: String, default: "Flexible" },
    timelineDays: { type: Number, default: 30 },
    applicants: [
      {
        candidateId: { type: String, required: true },
        candidateName: { type: String, default: "" },
        appliedAt: { type: String, default: () => new Date().toISOString() },
        status: { type: String, default: "Applied" }
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

OpportunitySchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  }
});

const Opportunity = mongoose.models.Opportunity || mongoose.model("Opportunity", OpportunitySchema);

module.exports = Opportunity;
