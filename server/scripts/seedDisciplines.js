const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Candidate = require("../models/Candidate");
const Opportunity = require("../models/Opportunity");

const newOpportunities = [
  {
    id: "opp-accounts-fin",
    title: "Junior Accounts Executive",
    company: "FinEdge Advisory & Associates",
    location: "Pune",
    workModes: ["Offline"],
    remote: false,
    shift: "Day",
    salary: 350000,
    commuteDistanceKm: 12,
    timelineDays: 20,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 1,
      allowedLocations: ["Pune", "Mumbai"],
      requiredCertifications: []
    },
    requiredSkills: ["Tally", "GST Filing", "MS Excel"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-rahul-deshmukh",
        candidateName: "Rahul Deshmukh",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-electrician-maint",
    title: "Industrial Maintenance Electrician",
    company: "Mahavitaran Engineering Works",
    location: "Nashik",
    workModes: ["Offline"],
    remote: false,
    shift: "Flexible",
    salary: 280000,
    commuteDistanceKm: 10,
    timelineDays: 15,
    criteria: {
      minQualification: "diploma",
      minExperienceYears: 2,
      allowedLocations: ["Nashik"],
      requiredCertifications: ["Wireman License"]
    },
    requiredSkills: ["Electrical Wiring", "Panel Maintenance", "Safety Procedures"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-ganesh-shinde",
        candidateName: "Ganesh Shinde",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-backoffice-data",
    title: "Back Office & Data Entry Associate",
    company: "Global Services Hub",
    location: "Mumbai",
    workModes: ["Offline"],
    remote: false,
    shift: "Day",
    salary: 220000,
    commuteDistanceKm: 15,
    timelineDays: 10,
    criteria: {
      minQualification: "12th",
      minExperienceYears: 0,
      allowedLocations: ["Mumbai", "Thane", "Navi Mumbai"],
      requiredCertifications: []
    },
    requiredSkills: ["Data Entry", "MS Excel", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-sneha-kulkarni",
        candidateName: "Sneha Kulkarni",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-customer-support",
    title: "Customer Support Representative",
    company: "TeleReach Solutions",
    location: "Bengaluru",
    workModes: ["Online"],
    remote: true,
    shift: "Flexible",
    salary: 300000,
    commuteDistanceKm: 0,
    timelineDays: 7,
    criteria: {
      minQualification: "12th",
      minExperienceYears: 0,
      allowedLocations: [],
      requiredCertifications: []
    },
    requiredSkills: ["Customer Service", "Communication"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-amit-trivedi",
        candidateName: "Amit Trivedi",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-mis-data-analyst",
    title: "Junior MIS & Data Analyst",
    company: "Apex Retail Intelligence",
    location: "Hyderabad",
    workModes: ["Offline", "Online"],
    remote: false,
    shift: "Day",
    salary: 450000,
    commuteDistanceKm: 14,
    timelineDays: 30,
    criteria: {
      minQualification: "bachelor",
      minExperienceYears: 1,
      allowedLocations: ["Hyderabad"],
      requiredCertifications: []
    },
    requiredSkills: ["SQL", "Power BI", "MS Excel"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-priya-nair",
        candidateName: "Priya Nair",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  },
  {
    id: "opp-plc-automation",
    title: "PLC & Automation Technician",
    company: "Siemens Automation Partner",
    location: "Aurangabad",
    workModes: ["Offline"],
    remote: false,
    shift: "Day",
    salary: 400000,
    commuteDistanceKm: 18,
    timelineDays: 25,
    criteria: {
      minQualification: "diploma",
      minExperienceYears: 2,
      allowedLocations: ["Aurangabad", "Pune"],
      requiredCertifications: []
    },
    requiredSkills: ["PLC Programming", "Electrical Wiring", "Troubleshooting"],
    preferredSkills: [],
    applicants: [
      {
        candidateId: "cand-sandeep-jadhav",
        candidateName: "Sandeep Jadhav",
        appliedAt: new Date().toISOString(),
        status: "Applied"
      }
    ]
  }
];

const newCandidates = [
  {
    id: "cand-rahul-deshmukh",
    name: "Rahul Deshmukh",
    location: "Pune",
    qualification: "bachelor",
    experienceYears: 2,
    certifications: ["Tally Certified Professional"],
    skills: ["Tally", "MS Excel"],
    expectedSalary: 320000,
    maxCommuteKm: 20,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Pune"],
    preferredShift: "Day",
    noticePeriodDays: 15,
    appliedOpportunityIds: ["opp-accounts-fin"],
    interestedOpportunityIds: ["opp-accounts-fin"],
    willingToRelocate: false
  },
  {
    id: "cand-ganesh-shinde",
    name: "Ganesh Shinde",
    location: "Nashik",
    qualification: "diploma",
    experienceYears: 3,
    certifications: ["Wireman License"],
    skills: ["Electrical Wiring", "Safety Procedures", "Panel Maintenance"],
    expectedSalary: 260000,
    maxCommuteKm: 25,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Nashik"],
    preferredShift: "Flexible",
    noticePeriodDays: 0,
    appliedOpportunityIds: ["opp-electrician-maint"],
    interestedOpportunityIds: ["opp-electrician-maint"],
    willingToRelocate: false
  },
  {
    id: "cand-sneha-kulkarni",
    name: "Sneha Kulkarni",
    location: "Mumbai",
    qualification: "12th",
    experienceYears: 1,
    certifications: [],
    skills: ["Data Entry", "MS Excel", "Communication"],
    expectedSalary: 200000,
    maxCommuteKm: 25,
    preferredWorkModes: ["Offline", "Online"],
    preferredLocations: ["Mumbai", "Thane"],
    preferredShift: "Day",
    noticePeriodDays: 7,
    appliedOpportunityIds: ["opp-backoffice-data"],
    interestedOpportunityIds: ["opp-backoffice-data"],
    willingToRelocate: false
  },
  {
    id: "cand-amit-trivedi",
    name: "Amit Trivedi",
    location: "Lucknow",
    qualification: "bachelor",
    experienceYears: 1,
    certifications: [],
    skills: ["Customer Service", "Communication"],
    expectedSalary: 280000,
    maxCommuteKm: 50,
    preferredWorkModes: ["Online"],
    preferredLocations: [],
    preferredShift: "Flexible",
    noticePeriodDays: 0,
    appliedOpportunityIds: ["opp-customer-support"],
    interestedOpportunityIds: ["opp-customer-support"],
    willingToRelocate: true
  },
  {
    id: "cand-priya-nair",
    name: "Priya Nair",
    location: "Hyderabad",
    qualification: "bachelor",
    experienceYears: 1.5,
    certifications: ["Microsoft Certified: Data Analyst Associate"],
    skills: ["SQL", "MS Excel", "Power BI"],
    expectedSalary: 420000,
    maxCommuteKm: 20,
    preferredWorkModes: ["Offline", "Online"],
    preferredLocations: ["Hyderabad"],
    preferredShift: "Day",
    noticePeriodDays: 15,
    appliedOpportunityIds: ["opp-mis-data-analyst"],
    interestedOpportunityIds: ["opp-mis-data-analyst"],
    willingToRelocate: false
  },
  {
    id: "cand-sandeep-jadhav",
    name: "Sandeep Jadhav",
    location: "Aurangabad",
    qualification: "diploma",
    experienceYears: 2.5,
    certifications: ["ITI Electrician"],
    skills: ["Electrical Wiring", "Troubleshooting"],
    expectedSalary: 380000,
    maxCommuteKm: 25,
    preferredWorkModes: ["Offline"],
    preferredLocations: ["Aurangabad", "Pune"],
    preferredShift: "Day",
    noticePeriodDays: 10,
    appliedOpportunityIds: ["opp-plc-automation"],
    interestedOpportunityIds: ["opp-plc-automation"],
    willingToRelocate: true
  }
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("Adding opportunities to MongoDB...");
  for (const opp of newOpportunities) {
    await Opportunity.findOneAndUpdate({ id: opp.id }, opp, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(` - Added/Updated Opportunity: ${opp.title} (${opp.company})`);
  }

  console.log("Adding candidates to MongoDB...");
  for (const cand of newCandidates) {
    await Candidate.findOneAndUpdate({ id: cand.id }, cand, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(` - Added/Updated Candidate: ${cand.name} (${cand.qualification})`);
  }

  // Also update local JSON files as backup
  const oppFile = path.join(__dirname, "../data/opportunities.json");
  const candFile = path.join(__dirname, "../data/candidates.json");

  try {
    const existingOpps = fs.existsSync(oppFile) ? JSON.parse(fs.readFileSync(oppFile, "utf8")) : [];
    const mergedOpps = [...existingOpps];
    for (const opp of newOpportunities) {
      const idx = mergedOpps.findIndex((o) => o.id === opp.id);
      if (idx !== -1) mergedOpps[idx] = opp;
      else mergedOpps.push(opp);
    }
    fs.writeFileSync(oppFile, JSON.stringify(mergedOpps, null, 2), "utf8");

    const existingCands = fs.existsSync(candFile) ? JSON.parse(fs.readFileSync(candFile, "utf8")) : [];
    const mergedCands = [...existingCands];
    for (const cand of newCandidates) {
      const idx = mergedCands.findIndex((c) => c.id === cand.id);
      if (idx !== -1) mergedCands[idx] = cand;
      else mergedCands.push(cand);
    }
    fs.writeFileSync(candFile, JSON.stringify(mergedCands, null, 2), "utf8");
    console.log("Updated local JSON backups.");
  } catch (err) {
    console.error("Local JSON backup warning:", err.message);
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
