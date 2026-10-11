const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Candidate = require("../models/Candidate");
const Opportunity = require("../models/Opportunity");
const LearningResource = require("../models/LearningResource");

async function runMigration() {
  console.log("Starting migration to MongoDB...");
  await connectDB();

  // 1. Migrate Candidates
  const candidatesPath = path.join(__dirname, "../data/candidates.json");
  if (fs.existsSync(candidatesPath)) {
    try {
      const raw = fs.readFileSync(candidatesPath, "utf-8");
      const candidates = JSON.parse(raw);
      if (Array.isArray(candidates) && candidates.length > 0) {
        console.log(`Migrating ${candidates.length} candidates...`);
        for (const c of candidates) {
          if (!c.id) continue;
          await Candidate.findOneAndUpdate({ id: c.id }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        console.log(`Successfully migrated ${candidates.length} candidates.`);
      } else {
        console.log("No candidates found in candidates.json.");
      }
    } catch (err) {
      console.error("Error migrating candidates:", err.message);
    }
  }

  // 2. Migrate Opportunities
  const opportunitiesPath = path.join(__dirname, "../data/opportunities.json");
  if (fs.existsSync(opportunitiesPath)) {
    try {
      const raw = fs.readFileSync(opportunitiesPath, "utf-8");
      const opportunities = JSON.parse(raw);
      if (Array.isArray(opportunities) && opportunities.length > 0) {
        console.log(`Migrating ${opportunities.length} opportunities...`);
        for (const o of opportunities) {
          if (!o.id) continue;
          await Opportunity.findOneAndUpdate({ id: o.id }, o, { upsert: true, new: true, setDefaultsOnInsert: true });
        }
        console.log(`Successfully migrated ${opportunities.length} opportunities.`);
      } else {
        console.log("No opportunities found in opportunities.json.");
      }
    } catch (err) {
      console.error("Error migrating opportunities:", err.message);
    }
  }

  // 3. Migrate Learning Resources
  const resourcesPath = path.join(__dirname, "../data/learningResources.json");
  if (fs.existsSync(resourcesPath)) {
    try {
      const raw = fs.readFileSync(resourcesPath, "utf-8");
      const data = JSON.parse(raw);
      const skills = data.skills || {};
      const skillKeys = Object.keys(skills);
      console.log(`Migrating ${skillKeys.length} learning resources...`);
      for (const skill of skillKeys) {
        const item = skills[skill];
        await LearningResource.findOneAndUpdate(
          { skill: skill.toLowerCase().trim() },
          {
            skill: skill.toLowerCase().trim(),
            prerequisites: item.prerequisites || [],
            courses: item.courses || []
          },
          { upsert: true, new: true }
        );
      }
      console.log(`Successfully migrated ${skillKeys.length} learning resources.`);
    } catch (err) {
      console.error("Error migrating learning resources:", err.message);
    }
  }

  console.log("Migration complete!");
}

if (require.main === module) {
  runMigration()
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error("Migration fatal error:", err);
      process.exit(1);
    });
}

module.exports = { runMigration };
