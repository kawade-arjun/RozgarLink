const fs = require("fs");
const path = require("path");
const { candidates, opportunities } = require("./seedData");

const candidatesFile = path.join(__dirname, "candidates.json");
const opportunitiesFile = path.join(__dirname, "opportunities.json");

fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2) + "\n", "utf8");
fs.writeFileSync(opportunitiesFile, JSON.stringify(opportunities, null, 2) + "\n", "utf8");

console.log(`Seeded ${candidates.length} candidates and ${opportunities.length} opportunities.`);
