const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Candidate = require("../models/Candidate");
const Opportunity = require("../models/Opportunity");

const additionalOpps = [
  {
    id: "opp-arts-graphic",
    title: "Graphic Designer & Visual Artist",
    company: "Creative Canvas Studios",
    location: "Pune",
    workModes: ["Offline", "Online"],
    remote: false,
    shift: "Day",
    salary: 380000,
    commuteDistanceKm: 12,
    timelineDays: 14,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 1,
      allowedLocations: ["Pune", "Mumbai"],
      requiredCertifications: []
    },
    requiredSkills: ["Graphic Design", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-ananya-arts",
        candidateName: "Ananya Sen",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-arts-writer",
    title: "Content Writer & Copywriter",
    company: "WordCraft Media",
    location: "Delhi",
    workModes: ["Online"],
    remote: true,
    shift: "Flexible",
    salary: 320000,
    commuteDistanceKm: 0,
    timelineDays: 10,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 0,
      allowedLocations: [],
      requiredCertifications: []
    },
    requiredSkills: ["Content Writing", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-kavita-writer",
        candidateName: "Kavita Roy",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-law-associate",
    title: "Junior Legal Associate",
    company: "Nyaya & Associates Law Firm",
    location: "Mumbai",
    workModes: ["Offline"],
    remote: false,
    shift: "Day",
    salary: 480000,
    commuteDistanceKm: 15,
    timelineDays: 20,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 1,
      allowedLocations: ["Mumbai", "Thane"],
      requiredCertifications: ["Bar Council Registration"]
    },
    requiredSkills: ["Legal Drafting", "Case Research", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-adv-rohan",
        candidateName: "Adv. Rohan Mehta",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      },
      {
        // INELIGIBLE applicant who applied to test hard gate exclusion
        candidateId: "cand-ineligible-test",
        candidateName: "Vikram Rathore (Ineligible Test)",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-law-compliance",
    title: "Corporate Legal Compliance Assistant",
    company: "Apex Corporate Legal Advisors",
    location: "Bengaluru",
    workModes: ["Offline", "Online"],
    remote: false,
    shift: "Day",
    salary: 550000,
    commuteDistanceKm: 10,
    timelineDays: 30,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 2,
      allowedLocations: ["Bengaluru"],
      requiredCertifications: []
    },
    requiredSkills: ["Corporate Law", "Case Research", "Legal Drafting"],
    preferredSkills: [],
    applicants: []
  },
  {
    id: "opp-health-nurse",
    title: "Staff Nurse & Patient Care Specialist",
    company: "Sanjeevani Multispeciality Hospital",
    location: "Pune",
    workModes: ["Offline"],
    remote: false,
    shift: "Rotational",
    salary: 360000,
    commuteDistanceKm: 8,
    timelineDays: 10,
    criteria: {
      minQualification: "diploma",
      minExperienceYears: 1,
      allowedLocations: ["Pune"],
      requiredCertifications: ["Nursing Council Registration"]
    },
    requiredSkills: ["Patient Care", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-meena-nurse",
        candidateName: "Meena Patil",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  }
];

const additionalCandidates = [
  {
    id: "cand-ananya-arts",
    name: "Ananya Sen",
    location: "Pune",
    qualification: "bachelor",
    experienceYears: 2,
    certifications: [],
    skills: ["Graphic Design", "Digital Illustration", "Communication"],
    expectedSalary: 350000,
    maxCommuteKm: 20,
    preferredWorkModes: ["Offline", "Online"],
    preferredLocations: ["Pune"],
    preferredShift: "Day",
    noticePeriodDays: 15,
    appliedOpportunityIds: ["opp-arts-graphic"],
    interestedOpportunityIds: ["opp-arts-graphic"],
    willingToRelocate: false
  },
  {
    id: "cand-kavita-writer",
    name: "Kavita Roy",
    location: "Kolkata",
    qualification: "bachelor",
    experienceYears: 1,
    certifications: [],
    skills: ["Content Writing", "Creative Writing", "Communication"],
    expectedSalary: 300000,
    maxCommuteKm: 50,
    preferredWorkModes: ["Online"],
    preferredLocations: [],
    preferredShift: "Flexible",
    noticePeriodDays: 0,
    appliedOpportunityIds: ["opp-arts-writer"],
    interestedOpportunityIds: ["opp-arts-writer"],
    willingToRelocate: true
  },
  {
    id: "cand-adv-rohan",
    name: "Adv. Rohan Mehta",
    location: "Mumbai",
    qualification: "bachelor",
    experienceYears: 2,
    certifications: ["Bar Council Registration"],
    skills: ["Legal Drafting", "Case Research", "Communication"],
    expectedSalary: 450000,
    maxCommuteKm: 20,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Mumbai"],
    preferredShift: "Day",
    noticePeriodDays: 15,
    appliedOpportunityIds: ["opp-law-associate"],
    interestedOpportunityIds: ["opp-law-associate"],
    willingToRelocate: false
  },
  {
    id: "cand-meena-nurse",
    name: "Meena Patil",
    location: "Pune",
    qualification: "diploma",
    experienceYears: 2,
    certifications: ["Nursing Council Registration"],
    skills: ["Patient Care", "Communication"],
    expectedSalary: 340000,
    maxCommuteKm: 15,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Pune"],
    preferredShift: "Flexible",
    noticePeriodDays: 7,
    appliedOpportunityIds: ["opp-health-nurse"],
    interestedOpportunityIds: ["opp-health-nurse"],
    willingToRelocate: false
  },
  {
    // Test Ineligible Candidate
    id: "cand-ineligible-test",
    name: "Vikram Rathore (Ineligible Test)",
    location: "Lucknow",
    qualification: "10th", // Fails bachelor requirement
    experienceYears: 0,    // Fails 1 year requirement
    certifications: [],    // Fails Bar Council Registration
    skills: ["Communication"],
    expectedSalary: 150000,
    maxCommuteKm: 10,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Lucknow"],
    preferredShift: "Day",
    noticePeriodDays: 0,
    appliedOpportunityIds: ["opp-law-associate"], // Applied to Law Associate
    interestedOpportunityIds: [],
    willingToRelocate: false
  }
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("Adding Arts, Law, and Healthcare opportunities...");
  for (const opp of additionalOpps) {
    await Opportunity.findOneAndUpdate({ id: opp.id }, opp, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(` + Added Opportunity: ${opp.title} (${opp.company})`);
  }

  console.log("Adding Candidates...");
  for (const cand of additionalCandidates) {
    await Candidate.findOneAndUpdate({ id: cand.id }, cand, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(` + Added Candidate: ${cand.name} (${cand.qualification})`);
  }

  // Backup to JSON files
  const oppFile = path.join(__dirname, "../data/opportunities.json");
  const candFile = path.join(__dirname, "../data/candidates.json");

  try {
    const existingOpps = fs.existsSync(oppFile) ? JSON.parse(fs.readFileSync(oppFile, "utf8")) : [];
    const mergedOpps = [...existingOpps];
    for (const opp of additionalOpps) {
      const idx = mergedOpps.findIndex((o) => o.id === opp.id);
      if (idx !== -1) mergedOpps[idx] = opp;
      else mergedOpps.push(opp);
    }
    fs.writeFileSync(oppFile, JSON.stringify(mergedOpps, null, 2), "utf8");

    const existingCands = fs.existsSync(candFile) ? JSON.parse(fs.readFileSync(candFile, "utf8")) : [];
    const mergedCands = [...existingCands];
    for (const cand of additionalCandidates) {
      const idx = mergedCands.findIndex((c) => c.id === cand.id);
      if (idx !== -1) mergedCands[idx] = cand;
      else mergedCands.push(cand);
    }
    fs.writeFileSync(candFile, JSON.stringify(mergedCands, null, 2), "utf8");
    console.log("Updated local JSON backups.");
  } catch (err) {
    console.error("Backup warning:", err.message);
  }

  console.log("Seeding Arts and Law completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
