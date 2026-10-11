const fs = require("fs");
const path = require("path");

const queues = new Map();

/**
 * Serialises operations on a specific file path through a promise queue.
 */
function enqueue(filePath, fn) {
  const normalizedPath = path.resolve(filePath);
  const current = queues.get(normalizedPath) || Promise.resolve();
  const next = current.then(fn, fn);
  queues.set(normalizedPath, next);
  return next;
}

/**
 * Writes data atomically to filePath using a temporary file and fs.rename.
 */
async function writeAtomicDirect(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  const content = JSON.stringify(data, null, 2) + "\n";
  await fs.promises.writeFile(tmpPath, content, "utf8");
  await fs.promises.rename(tmpPath, filePath);
}

/**
 * Ensures that the file exists and is not empty. If missing or empty, writes [].
 */
async function ensureFile(filePath) {
  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.size === 0) {
      await writeAtomicDirect(filePath, []);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      await writeAtomicDirect(filePath, []);
    } else {
      throw err;
    }
  }
}

/**
 * Reads and parses JSON from the file. If missing, empty, or corrupted, resets to [] and returns [].
 */
async function read(filePath) {
  const resolved = path.resolve(filePath);
  await ensureFile(resolved);
  try {
    const raw = await fs.promises.readFile(resolved, "utf8");
    const trimmed = raw.trim();
    if (!trimmed) {
      await writeAtomicDirect(resolved, []);
      return [];
    }
    return JSON.parse(trimmed);
  } catch {
    await writeAtomicDirect(resolved, []);
    return [];
  }
}

/**
 * Writes data to filePath atomically, queued by file.
 */
async function write(filePath, data) {
  const resolved = path.resolve(filePath);
  return enqueue(resolved, () => writeAtomicDirect(resolved, data));
}

/**
 * Runs a transactional read-modify-write on the file, queued by file.
 */
async function update(filePath, updaterFn) {
  const resolved = path.resolve(filePath);
  return enqueue(resolved, async () => {
    const current = await read(resolved);
    const updated = await updaterFn(current);
    await writeAtomicDirect(resolved, updated);
    return updated;
  });
}

module.exports = {
  read,
  write,
  update,
  ensureFile
};
