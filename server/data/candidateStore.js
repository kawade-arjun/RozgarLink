const path = require("path");
const crypto = require("crypto");
const jsonFile = require("./jsonFile");

const FILE_PATH = path.join(__dirname, "candidates.json");

async function getAll() {
  return jsonFile.read(FILE_PATH);
}

async function getById(id) {
  const all = await getAll();
  return all.find((c) => c.id === id) || null;
}

async function create(candidateData) {
  const newCandidate = {
    ...candidateData,
    id: crypto.randomUUID()
  };
  await jsonFile.update(FILE_PATH, (items) => [...items, newCandidate]);
  return newCandidate;
}

async function update(id, candidateData) {
  let updatedCandidate = null;
  await jsonFile.update(FILE_PATH, (items) => {
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) {
      return items;
    }
    updatedCandidate = {
      ...candidateData,
      id
    };
    const next = [...items];
    next[index] = updatedCandidate;
    return next;
  });
  return updatedCandidate;
}

async function removeOpportunityInterest(oppId) {
  return jsonFile.update(FILE_PATH, (items) => {
    return items.map((c) => {
      if (!Array.isArray(c.interestedOpportunityIds) || !c.interestedOpportunityIds.includes(oppId)) {
        return c;
      }
      return {
        ...c,
        interestedOpportunityIds: c.interestedOpportunityIds.filter((id) => id !== oppId)
      };
    });
  });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  removeOpportunityInterest
};
