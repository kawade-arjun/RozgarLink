const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");
const jsonFile = require("./jsonFile");

const FILE_PATH = path.join(__dirname, "opportunities.json");

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
    const docs = await Opportunity.find({}).lean();
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
    const doc = await Opportunity.findOne({ id }).lean();
    if (!doc) return null;
    delete doc._id;
    delete doc.__v;
    return doc;
  }
  const all = await getAll();
  return all.find((o) => o.id === id) || null;
}

async function create(oppData) {
  const id = oppData.id || crypto.randomUUID();
  if (isMongoReady()) {
    const created = await Opportunity.create({
      ...oppData,
      id
    });
    return cleanDoc(created);
  }
  const newOpp = {
    ...oppData,
    id
  };
  await jsonFile.update(FILE_PATH, (items) => [...items, newOpp]);
  return newOpp;
}

async function update(id, oppData) {
  if (isMongoReady()) {
    const updated = await Opportunity.findOneAndUpdate(
      { id },
      { $set: { ...oppData, id } },
      { new: true, runValidators: true }
    );
    return cleanDoc(updated);
  }
  let updatedOpp = null;
  await jsonFile.update(FILE_PATH, (items) => {
    const index = items.findIndex((o) => o.id === id);
    if (index === -1) {
      return items;
    }
    updatedOpp = {
      ...oppData,
      id
    };
    const next = [...items];
    next[index] = updatedOpp;
    return next;
  });
  return updatedOpp;
}

async function remove(id) {
  if (isMongoReady()) {
    const result = await Opportunity.deleteOne({ id });
    return result.deletedCount > 0;
  }
  let removed = false;
  await jsonFile.update(FILE_PATH, (items) => {
    const index = items.findIndex((o) => o.id === id);
    if (index === -1) {
      return items;
    }
    removed = true;
    return items.filter((o) => o.id !== id);
  });
  return removed;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
