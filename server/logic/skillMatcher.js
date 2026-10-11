/**
 * SEMANTIC SKILL MATCHING (used for RANKING and GAP DETECTION only, never eligibility).
 *
 * Fully offline "NLP" pipeline:
 *   1. Normalise text (case, punctuation, spacing)
 *   2. Synonym / alias ontology  -> canonical skill  ("ReactJS" -> "react")
 *   3. Character-trigram cosine similarity -> catches typos and variants ("javascrpt")
 *
 * To plug in a real embedding model later, replace `similarity()` only.
 */

const SYNONYMS = {
  "react": ["reactjs", "react.js", "react js", "react developer"],
  "javascript": ["js", "ecmascript", "es6", "java script", "vanilla js"],
  "typescript": ["ts"],
  "node.js": ["node", "nodejs", "node js"],
  "html": ["html5", "hypertext markup language"],
  "css": ["css3", "cascading style sheets"],
  "tailwind css": ["tailwind", "tailwindcss"],
  "git": ["github", "git hub", "version control"],
  "python": ["python3", "py"],
  "sql": ["mysql", "postgresql", "postgres", "structured query language", "sqlite"],
  "machine learning": ["ml"],
  "power bi": ["powerbi", "microsoft power bi"],
  "ms excel": ["excel", "microsoft excel", "ms-excel", "spreadsheets", "advanced excel"],
  "tally": ["tally erp", "tally prime", "tallyprime", "tally erp 9"],
  "gst filing": ["gst", "gst returns"],
  "data entry": ["typing", "data-entry", "computer typing"],
  "customer service": ["customer support", "customer care", "client support", "helpdesk"],
  "communication": ["verbal communication", "communication skills", "spoken english", "written communication"],
  "electrical wiring": ["wiring", "house wiring", "industrial wiring"],
  "panel maintenance": ["panel board maintenance", "switchboard maintenance"],
  "safety procedures": ["safety protocols", "industrial safety", "ohs"],
  "plc programming": ["plc", "ladder logic"],
  "troubleshooting": ["fault finding", "debugging", "problem solving"]
};

const key = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9+#]/g, "");

const ALIAS_TO_CANON = new Map();
for (const [canon, aliases] of Object.entries(SYNONYMS)) {
  ALIAS_TO_CANON.set(key(canon), canon);
  aliases.forEach((a) => ALIAS_TO_CANON.set(key(a), canon));
}

/** Map any skill string to its canonical lowercase name. */
function canonical(skill) {
  return ALIAS_TO_CANON.get(key(skill)) || String(skill ?? "").trim().toLowerCase();
}

function trigrams(s) {
  const padded = `  ${key(s)} `;
  const m = new Map();
  for (let i = 0; i < padded.length - 2; i++) {
    const g = padded.slice(i, i + 3);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [g, v] of a) { na += v * v; if (b.has(g)) dot += v * b.get(g); }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const FUZZY_THRESHOLD = 0.75; // typos ~0.76-0.82; distinct skills like Java vs JavaScript ~0.54

/** @returns {{score:number, type:'exact'|'synonym'|'fuzzy'|'none'}} */
function similarity(a, b) {
  if (key(a) === key(b)) return { score: 1, type: "exact" };
  if (canonical(a) === canonical(b)) return { score: 1, type: "synonym" };
  const s = cosine(trigrams(canonical(a)), trigrams(canonical(b)));
  return s >= FUZZY_THRESHOLD ? { score: s, type: "fuzzy" } : { score: 0, type: "none" };
}

/** Match a list of wanted skills against what the candidate has. */
function matchSkills(candidateSkills = [], wantedSkills = []) {
  const matched = [];
  const missing = [];
  for (const wanted of wantedSkills) {
    let best = null;
    for (const have of candidateSkills) {
      const sim = similarity(have, wanted);
      if (sim.score > 0 && (!best || sim.score > best.score)) best = { have, ...sim };
    }
    if (best) matched.push({ skill: wanted, candidateSkill: best.have, score: best.score, type: best.type });
    else missing.push(wanted);
  }
  return { matched, missing };
}

module.exports = { matchSkills, similarity, canonical, SYNONYMS };
