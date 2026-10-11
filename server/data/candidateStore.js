const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const jsonFile = require("./jsonFile");

const FILE_PATH = path.join(__dirname, "candidates.json");

function isMongoReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function cleanDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAll() {
  if (isMongoReady()) {
    const docs = await Candidate.find({}).lean();
    return docs.map((d) => {
      delete d._id;
      delete d.__v;
      return d;
    });
  }
  return jsonFile.read(FILE_PATH);
}

async function getById(id) {
  if (isMongoReady()) {
    const doc = await Candidate.findOne({ id }).lean();
    if (!doc) return null;
    delete doc._id;
    delete doc.__v;
    return doc;
  }
  const all = await getAll();
  return all.find((c) => c.id === id) || null;
}

async function create(candidateData) {
  const id = candidateData.id || crypto.randomUUID();
  if (isMongoReady()) {
    const created = await Candidate.create({
      ...candidateData,
      id
    });
    return cleanDoc(created);
  }
  const newCandidate = {
    ...candidateData,
    id
  };
  await jsonFile.update(FILE_PATH, (items) => [...items, newCandidate]);
  return newCandidate;
}

async function update(id, candidateData) {
  if (isMongoReady()) {
    const updated = await Candidate.findOneAndUpdate(
      { id },
      { $set: { ...candidateData, id } },
      { new: true, runValidators: true }
    );
    return cleanDoc(updated);
  }
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
  if (isMongoReady()) {
    return Candidate.updateMany(
      { interestedOpportunityIds: oppId },
      { $pull: { interestedOpportunityIds: oppId } }
    );
  }
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
