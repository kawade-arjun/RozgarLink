const crypto = require("crypto");
const Candidate = require("../models/Candidate");

function cleanDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAll() {
  const docs = await Candidate.find({}).lean();
  return docs.map((d) => {
    delete d._id;
    delete d.__v;
    return d;
  });
}

async function getById(id) {
  const doc = await Candidate.findOne({ id }).lean();
  if (!doc) return null;
  delete doc._id;
  delete doc.__v;
  return doc;
}

async function create(candidateData) {
  const id = candidateData.id || crypto.randomUUID();
  const created = await Candidate.create({
    ...candidateData,
    id
  });
  return cleanDoc(created);
}

async function update(id, candidateData) {
  const updated = await Candidate.findOneAndUpdate(
    { id },
    { $set: { ...candidateData, id } },
    { new: true, runValidators: true }
  );
  return cleanDoc(updated);
}

async function removeOpportunityInterest(oppId) {
  return Candidate.updateMany(
    { interestedOpportunityIds: oppId },
    { $pull: { interestedOpportunityIds: oppId } }
  );
}

async function addAppliedOpportunity(candidateId, oppId) {
  return Candidate.findOneAndUpdate(
    { id: candidateId },
    { $addToSet: { appliedOpportunityIds: oppId } },
    { new: true }
  );
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  removeOpportunityInterest,
  addAppliedOpportunity
};
