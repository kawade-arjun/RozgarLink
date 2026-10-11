const path = require("path");
const crypto = require("crypto");
const jsonFile = require("./jsonFile");

const FILE_PATH = path.join(__dirname, "opportunities.json");

async function getAll() {
  return jsonFile.read(FILE_PATH);
}

async function getById(id) {
  const all = await getAll();
  return all.find((o) => o.id === id) || null;
}

async function create(oppData) {
  const newOpp = {
    ...oppData,
    id: crypto.randomUUID()
  };
  await jsonFile.update(FILE_PATH, (items) => [...items, newOpp]);
  return newOpp;
}

async function update(id, oppData) {
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
