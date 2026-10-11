const crypto = require("crypto");
const Opportunity = require("../models/Opportunity");

function cleanDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAll(filter = {}) {
  const docs = await Opportunity.find(filter).lean();
  return docs.map((d) => {
    delete d._id;
    delete d.__v;
    return d;
  });
}

async function getById(id) {
  const doc = await Opportunity.findOne({ id }).lean();
  if (!doc) return null;
  delete doc._id;
  delete doc.__v;
  return doc;
}

async function create(oppData) {
  const id = oppData.id || crypto.randomUUID();
  const created = await Opportunity.create({
    ...oppData,
    id
  });
  return cleanDoc(created);
}

async function update(id, oppData) {
  const updated = await Opportunity.findOneAndUpdate(
    { id },
    { $set: { ...oppData, id } },
    { new: true, runValidators: true }
  );
  return cleanDoc(updated);
}

async function remove(id) {
  const result = await Opportunity.deleteOne({ id });
  return result.deletedCount > 0;
}

async function addApplicant(oppId, applicant) {
  const opp = await Opportunity.findOne({ id: oppId });
  if (!opp) return null;
  const exists = (opp.applicants || []).some((a) => a.candidateId === applicant.candidateId);
  if (!exists) {
    await Opportunity.updateOne(
      { id: oppId },
      {
        $push: {
          applicants: {
            candidateId: applicant.candidateId,
            candidateName: applicant.candidateName || "",
            appliedAt: new Date().toISOString(),
            status: "Applied"
          }
        }
      }
    );
  }
  const refreshed = await Opportunity.findOne({ id: oppId }).lean();
  return cleanDoc(refreshed);
}

async function updateApplicantStatus(oppId, candidateId, status) {
  const opp = await Opportunity.findOne({ id: oppId });
  if (!opp) return null;
  const applicantIndex = (opp.applicants || []).findIndex((a) => a.candidateId === candidateId);
  if (applicantIndex === -1) return null;

  opp.applicants[applicantIndex].status = status;
  await opp.save();
  return cleanDoc(opp.toObject());
}

async function getApplicantStatus(oppId, candidateId) {
  const opp = await Opportunity.findOne({ id: oppId }).lean();
  if (!opp) return null;
  const applicant = (opp.applicants || []).find((a) => a.candidateId === candidateId);
  return applicant ? applicant.status : null;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  addApplicant,
  updateApplicantStatus,
  getApplicantStatus
};
