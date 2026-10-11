const candidates = [
  {
    "id": "c1",
    "name": "Asha Patil",
    "location": "Pune",
    "willingToRelocate": false,
    "preferredLocations": ["Pune", "Mumbai"],
    "qualification": "bachelor",
    "experienceYears": 1,
    "skills": ["ReactJS", "JS", "HTML5", "CSS3", "Git"],
    "certifications": [],
    "interestedOpportunityIds": ["o1"]
  },
  {
    "id": "c2",
    "name": "Rahul Deshmukh",
    "location": "Nashik",
    "willingToRelocate": true,
    "preferredLocations": ["Pune"],
    "qualification": "diploma",
    "experienceYears": 3,
    "skills": ["Electrical Wiring", "Panel Maintenance", "Safety Procedures"],
    "certifications": ["ITI Electrician"],
    "interestedOpportunityIds": []
  },
  {
    "id": "c3",
    "name": "Sneha Kulkarni",
    "location": "Kolhapur",
    "willingToRelocate": false,
    "preferredLocations": ["Kolhapur"],
    "qualification": "12th",
    "experienceYears": 2,
    "skills": ["Typing", "Microsoft Excel", "Customer Support", "Verbal Communication"],
    "certifications": [],
    "interestedOpportunityIds": []
  }
];

const opportunities = [
  {
    "id": "o1", "title": "Frontend Developer", "company": "BrightByte Labs", "location": "Pune", "remote": false,
    "criteria": { "minQualification": "bachelor", "minExperienceYears": 2, "allowedLocations": ["Pune"], "requiredCertifications": [] },
    "requiredSkills": ["React", "JavaScript", "HTML", "CSS", "Node.js"],
    "preferredSkills": ["Tailwind CSS", "Git", "TypeScript"]
  },
  {
    "id": "o2", "title": "Junior Web Developer", "company": "Sahyadri Digital", "location": "Pune", "remote": false,
    "criteria": { "minQualification": "bachelor", "minExperienceYears": 0, "allowedLocations": ["Pune", "Mumbai"], "requiredCertifications": [] },
    "requiredSkills": ["React", "JavaScript", "HTML", "CSS"],
    "preferredSkills": ["Git", "Node.js"]
  },
  {
    "id": "o3", "title": "Remote Frontend Intern", "company": "CloudNest", "location": "Remote", "remote": true,
    "criteria": { "minQualification": "12th", "minExperienceYears": 0, "allowedLocations": [], "requiredCertifications": [] },
    "requiredSkills": ["HTML", "CSS", "JavaScript"],
    "preferredSkills": ["React", "Git"]
  },
  {
    "id": "o4", "title": "Industrial Electrician", "company": "Bharat Switchgear Pvt Ltd", "location": "Pune", "remote": false,
    "criteria": { "minQualification": "diploma", "minExperienceYears": 2, "allowedLocations": ["Pune", "Pimpri-Chinchwad"], "requiredCertifications": ["ITI Electrician"] },
    "requiredSkills": ["Electrical Wiring", "Panel Maintenance", "Safety Procedures"],
    "preferredSkills": ["PLC Programming", "Troubleshooting"]
  },
  {
    "id": "o5", "title": "Customer Support Executive", "company": "HelpDesk India", "location": "Kolhapur", "remote": false,
    "criteria": { "minQualification": "12th", "minExperienceYears": 1, "allowedLocations": ["Kolhapur", "Sangli"], "requiredCertifications": [] },
    "requiredSkills": ["Customer Service", "Communication", "Data Entry"],
    "preferredSkills": ["MS Excel", "Hindi", "Marathi"]
  },
  {
    "id": "o6", "title": "Accounts Assistant", "company": "Patwardhan & Co.", "location": "Pune", "remote": false,
    "criteria": { "minQualification": "bachelor", "minExperienceYears": 1, "allowedLocations": ["Pune"], "requiredCertifications": [] },
    "requiredSkills": ["Tally", "MS Excel", "Data Entry"],
    "preferredSkills": ["GST Filing", "Communication"]
  },
  {
    "id": "o7", "title": "Data Analyst", "company": "InsightWorks", "location": "Remote", "remote": true,
    "criteria": { "minQualification": "bachelor", "minExperienceYears": 1, "allowedLocations": [], "requiredCertifications": [] },
    "requiredSkills": ["Python", "SQL", "MS Excel"],
    "preferredSkills": ["Machine Learning", "Power BI"]
  }
];

module.exports = { candidates, opportunities };
