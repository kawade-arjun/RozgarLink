# RozgarLink

Opportunity matching with strict eligibility, explainable ranking, skill gaps and offline learning pathways.

## Run
```bash
cd server && npm install && npm start      # http://localhost:5000
cd client && npm install && npm run dev    # http://localhost:5173 (proxies /api to 5000)
```

Optional demo seed data (never runs automatically):
```bash
cd server && npm run seed
```

## Manual Entry Flow
Both candidates and opportunities start empty and are entered manually through the UI:
1. **Find opportunities tab**: Enter candidate details (Name, Current city, Relocation preference, Preferred cities, Highest qualification, Years of experience, Skills, Certifications). Real-time matching updates the dashboard as you type. Click "Save profile" to persist to the database (saved ID is stored in `localStorage`). Click "Start a new profile" to reset.
2. **Manage opportunities tab**: Create, edit, and delete opportunities with custom eligibility rules (minimum qualification, minimum experience, allowed locations, mandatory certifications), required skills, and preferred skills. Any change to opportunities triggers an immediate re-match against the candidate profile.

## API Endpoints (`/api`)

### Candidates
- `GET /api/candidates` — List all stored candidates
- `GET /api/candidates/:id` — Retrieve candidate by ID (404 if not found)
- `POST /api/candidates` — Create candidate (returns 201 with generated UUID; validates required name, city, valid qualification, non-negative experience)
- `PUT /api/candidates/:id` — Update candidate (returns 200, or 404 if not found)

### Opportunities
- `GET /api/opportunities` — List all stored opportunities
- `GET /api/opportunities/:id` — Retrieve opportunity by ID (404 if not found)
- `POST /api/opportunities` — Create opportunity (returns 201 with generated UUID; validates title, company, location, minQualification, non-negative minExperienceYears, at least one required skill; sanitizes remote roles to empty `allowedLocations`)
- `PUT /api/opportunities/:id` — Update opportunity (returns 200, or 404 if not found)
- `DELETE /api/opportunities/:id` — Delete opportunity (returns 204, or 404; automatically removes opportunity ID from all candidate interest lists)

### Matching & Meta
- `GET /api/meta` — Returns allowed qualification levels and labels
- `POST /api/match` — Stateless real-time matching of `{ candidate }` against all current opportunities stored in the database

## How the requirements are met
| Requirement | Where |
|---|---|
| Two-stage filtering | `routes/matching.js`: eligibility first, then ranking |
| Strict disqualification / no AI for eligibility | `logic/eligibility.js` (plain rules, no NLP) |
| Eligible-only ranking | `rankEligible()` only receives opportunities that passed |
| Semantic skill matching | `logic/skillMatcher.js` (synonyms + trigram similarity, offline) |
| Explainable matches / failures | `reason` in `ranking.js`; `failures[].message` in `eligibility.js` |
| Skill gap detection | `skillGaps` in `/api/match` for opportunities marked interested |
| Offline learning pathways | `logic/learningPathway.js` + `data/learningResources.json` |
| Real-time updates | `App.jsx` re-posts profile to `/api/match` on edits (debounced) and when opportunities change |
| Atomic JSON storage & queues | `server/data/jsonFile.js`, `candidateStore.js`, `opportunityStore.js` |
| Manual data entry & validation | `CandidateForm.jsx`, `OpportunityForm.jsx`, `ManageOpportunities.jsx` |
| Decision support | Criteria live in opportunity records; code never hardcodes them |

## Extending
- New hard rule: add a field under `criteria` in opportunities and one check in `eligibility.js`.
- New synonyms: add to `SYNONYMS` in `skillMatcher.js`.
- New course: add to `learningResources.json` under the canonical lowercase skill name.
