/** Share links contain an authored investigation ID, never a learner's answers. */
export const investigations = [
  {
    id: "period-three-trend",
    title: "A journey across period three",
    question: "How do tabulated electronegativity values change from sodium to chlorine?",
    predictionPrompt:
      "Before revealing the values, predict the pattern you expect across this row.",
    observationPrompt:
      "Describe the pattern in the displayed values. Include at least two named elements and their values.",
    explanationPrompt:
      "Compare your prediction with the data. Explain the pattern, and name one limit of this comparison.",
    reflectionGuide:
      "The selected Pauling values increase from sodium to chlorine. Across a period, increasing nuclear charge generally strengthens attraction for bonding electrons. This is a comparison on one scale, not a rule for every property or a measurement of electron paths. Argon is not included because a comparable Pauling value is not supplied.",
    atomicNumbers: [11, 12, 13, 14, 15, 16, 17],
    propertyLabels: ["Electronegativity"],
  },
  {
    id: "everyday-metals",
    title: "Two useful everyday metals",
    question: "For equal volumes of pure aluminium and copper, which sample would have less mass?",
    predictionPrompt:
      "Predict which metal would be lighter at equal volume. Explain what you are assuming.",
    observationPrompt:
      "Compare the two tabulated densities and their everyday uses. Record the units alongside the values.",
    explanationPrompt:
      "Use mass = density × volume to explain the equal-volume comparison. Does density alone tell you which material makes a better wire or can?",
    reflectionGuide:
      "Aluminium has the lower tabulated density, so an equal volume of the pure metal has less mass under comparable conditions. Material choices also depend on conductivity, strength, cost, corrosion and alloys. Everyday objects may be alloys or compounds; these pure-element values do not describe every object. The source does not supply all measurement conditions or uncertainty.",
    atomicNumbers: [13, 29],
    propertyLabels: ["Density"],
  },
] as const;

export type InvestigationId = (typeof investigations)[number]["id"];
export type InvestigationDraft = {
  id: InvestigationId;
  stage: 0 | 1 | 2 | 3;
  prediction: string;
  observation: string;
  explanation: string;
  updatedAt: string;
};
export type InvestigationDrafts = Partial<Record<InvestigationId, InvestigationDraft>>;
export type InvestigationEvidence = {
  atomicNumber: number;
  symbol: string;
  name: string;
  everyday: string;
  properties: Array<{
    label: string;
    value: string;
    unit?: string;
    note: string;
    source: { label: string; url: string; edition: string; retrievedAt: string };
  }>;
};

export const INVESTIGATION_STORAGE_KEY = "hydromental.investigations.v1";

export function parseInvestigationId(value: unknown): InvestigationId | null {
  return typeof value === "string" && investigations.some((item) => item.id === value)
    ? (value as InvestigationId)
    : null;
}

export function investigationFromSearch(search: string): InvestigationId | null {
  if (search.length > 4096) return null;
  const values = new URLSearchParams(search).getAll("investigation");
  return values.length === 1 ? parseInvestigationId(values[0]) : null;
}

export function investigationShareUrl(id: InvestigationId, origin: string): string {
  if (!parseInvestigationId(id)) throw new RangeError("Choose an authored investigation.");
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new RangeError("Use the application's HTTP or HTTPS origin.");
  const url = new URL("/", base.origin);
  url.searchParams.set("investigation", id);
  return url.href;
}

export function newInvestigationDraft(id: InvestigationId): InvestigationDraft {
  return { id, stage: 0, prediction: "", observation: "", explanation: "", updatedAt: "" };
}

/** Restore only the two known records, with bounded plain text and valid step prerequisites. */
export function readInvestigationDrafts(value: unknown): InvestigationDrafts {
  if (typeof value === "string") {
    if (value.length > 40_000) return {};
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const payload = value as Record<string, unknown>;
  if (
    payload.version !== 1 ||
    !payload.drafts ||
    typeof payload.drafts !== "object" ||
    Array.isArray(payload.drafts)
  )
    return {};
  const raw = payload.drafts as Record<string, unknown>;
  const result: InvestigationDrafts = {};
  for (const investigation of investigations) {
    const entry = raw[investigation.id];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const draft = entry as Record<string, unknown>;
    if (draft.id !== investigation.id) continue;
    const text = (key: string) => (typeof draft[key] === "string" ? draft[key].slice(0, 2000) : "");
    const prediction = text("prediction");
    const observation = text("observation");
    const explanation = text("explanation");
    const requested =
      typeof draft.stage === "number" && Number.isInteger(draft.stage)
        ? Math.max(0, Math.min(3, draft.stage))
        : 0;
    const available = !prediction.trim()
      ? 0
      : !observation.trim()
        ? 1
        : !explanation.trim()
          ? 2
          : 3;
    result[investigation.id] = {
      id: investigation.id,
      stage: Math.min(requested, available) as InvestigationDraft["stage"],
      prediction,
      observation,
      explanation,
      updatedAt:
        typeof draft.updatedAt === "string" &&
        draft.updatedAt.length <= 40 &&
        Number.isFinite(Date.parse(draft.updatedAt))
          ? draft.updatedAt
          : "",
    };
  }
  return result;
}

/** A writable restore must be lossless; malformed or future fields need explicit recovery. */
export function restoreInvestigationDrafts(raw: string | null): InvestigationDrafts | null {
  if (raw === null) return {};
  if (raw.length > 40_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const payload = value as Record<string, unknown>;
    if (
      Object.keys(payload).length !== 2 ||
      payload.version !== 1 ||
      !payload.drafts ||
      typeof payload.drafts !== "object" ||
      Array.isArray(payload.drafts)
    )
      return null;
    const records = payload.drafts as Record<string, unknown>;
    const clean = readInvestigationDrafts(value);
    if (Object.keys(records).length !== Object.keys(clean).length) return null;
    for (const [id, draft] of Object.entries(clean)) {
      const original = records[id] as Record<string, unknown>;
      if (
        Object.keys(original).length !== Object.keys(draft).length ||
        Object.entries(draft).some(([key, field]) => original[key] !== field)
      )
        return null;
    }
    return clean;
  } catch {
    return null;
  }
}

export function investigationReport(
  draft: InvestigationDraft,
  evidence: InvestigationEvidence[],
  retrievedAt: string,
): string {
  const clean = readInvestigationDrafts({ version: 1, drafts: { [draft.id]: draft } })[draft.id];
  if (!clean) throw new RangeError("Choose a valid investigation response.");
  const investigation = investigations.find((item) => item.id === clean.id)!;
  return JSON.stringify(
    {
      format: "hydromental-investigation",
      version: 1,
      investigation: {
        id: investigation.id,
        title: investigation.title,
        question: investigation.question,
      },
      response: clean,
      evidence: evidence.filter((item) =>
        investigation.atomicNumbers.some((z) => z === item.atomicNumber),
      ),
      sourceSnapshotRetrievedAt: retrievedAt,
      note: "Learner-owned notes and source data, exported by the learner. These responses are not automatically graded or teacher-verified, and do not establish scientific mastery. No learner responses are included in the share link.",
    },
    null,
    2,
  );
}
