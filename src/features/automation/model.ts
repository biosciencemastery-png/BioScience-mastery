import { z } from "zod";

export const sourceUrl = z
  .string()
  .max(2048)
  .regex(/^https:\/\/[a-z0-9.-]+(?:\/[a-zA-Z0-9/_~.%-]*)?$/)
  .refine((value) => {
    try {
      const u = new URL(value);
      return (
        (u.href === value || u.origin === value) &&
        u.hostname.includes(".") &&
        !/^[\d.]+$/.test(u.hostname) &&
        !/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname) &&
        !u.pathname.includes("..")
      );
    } catch {
      return false;
    }
  }, "Use an approved public HTTPS source URL");
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const id = z.uuid();
const review = { id, version: z.coerce.number().int().positive() };
const language = z.enum(["en", "hi"]);
export const categories = [
  "notice",
  "ambiguous_date",
  "contradiction",
  "retrieval_failure",
  "deadline_change",
  "security_incident",
  "owner_approval",
] as const;
export const commandSchema = z.discriminatedUnion("command", [
  z.object({
    command: z.literal("source"),
    id: z.union([id, z.literal("")]).optional(),
    version: z.coerce.number().int().positive().optional(),
    examination_id: id,
    name: text(2, 160),
    url: sourceUrl,
    source_type: z.enum(["notice", "website", "syllabus", "document"]),
    active: z.boolean(),
    verification_status: z.enum(["needs_review", "verified"]),
    verification_notes: z.string().trim().max(2000),
    licensing_notes: text(2, 2000),
  }),
  z.object({
    command: z.literal("collect"),
    source_id: id,
    idempotency_key: id,
    text: text(1, 12000),
    language,
    outcome: z.enum(["complete", "failure"]),
  }),
  z.object({
    command: z.literal("triage"),
    ...review,
    status: z.enum(["needs_review", "verified"]),
    category: z.enum(categories),
    notes: text(10, 2000),
  }),
  z.object({
    command: z.literal("draft"),
    ...review,
    title: text(2, 200),
    body: text(10, 12000),
    language,
    licensing_notes: text(2, 2000),
    rights_confirmed: z.literal(true),
  }),
  z.object({
    command: z.enum(["approve", "reject"]),
    ...review,
    notes: text(10, 2000),
  }),
]);

// A local/test environment and an explicit application gate are both required.
// The database has a separate operator-controlled kill switch.
export function manualCollectionAllowed(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.AUTOMATION_MANUAL_ENABLED !== "true" ||
    env.AUTOMATION_ENV !== "development" ||
    (env.VERCEL_ENV && env.VERCEL_ENV !== "development")
  )
    return false;
  try {
    return ["localhost", "127.0.0.1"].includes(
      new URL(env.SITE_URL ?? "").hostname,
    );
  } catch {
    return false;
  }
}
export function importantAlert(item: {
  category: string;
  verified_at: string | null;
  status: string;
}) {
  if (item.status === "rejected") return null;
  if (item.category === "security_incident") return "security_incident";
  if (item.category === "owner_approval" && item.status !== "published")
    return "owner_approval";
  if (item.category === "deadline_change" && item.verified_at)
    return "verified_deadline_change";
  return null;
}

// Deliberately no transport/provider. Environment variables cannot activate AI.
export const aiPolicy = Object.freeze({
  enabled: false,
  approvedBudget: 0,
  perRequestLimit: 0,
  dailyBudget: 0,
  monthlyBudget: 0,
  requireCache: true,
  requireDeduplication: true,
});
export function assessAiRequest(input: {
  classification: string;
  cacheKey: string;
  estimatedCost: number;
}) {
  if (input.classification !== "verified_public_licensed_evidence")
    return { allowed: false, reason: "restricted_data" } as const;
  if (
    !input.cacheKey.trim() ||
    !Number.isFinite(input.estimatedCost) ||
    input.estimatedCost < 0
  )
    return { allowed: false, reason: "invalid_request" } as const;
  return { allowed: false, reason: "external_ai_disabled" } as const;
}

export type Source = {
  id: string;
  examination_id: string;
  name: string;
  url: string;
  source_type: string;
  active: boolean;
  verification_status: string;
  verification_notes: string;
  licensing_notes: string;
  version: number;
  freshness: string;
  last_checked_at: string | null;
  last_success_at: string | null;
  fingerprint: string | null;
};
export type Review = {
  id: string;
  version: number;
  status: string;
  category: string;
  verification_notes: string;
  verified_at: string | null;
  source_url: string;
  excerpt: string;
  language: "en" | "hi";
  licensing_notes: string;
  fingerprint: string | null;
  previous_fingerprint: string | null;
  retrieved_at: string;
  change_type: string;
  current_revision_id: string | null;
};
export type Revision = {
  id: string;
  review_id: string;
  revision: number;
  title: string;
  body: string;
  language: "en" | "hi";
  source_url: string;
  licensing_notes: string;
  attribution: string;
  created_at: string;
};
export type Dashboard = {
  is_admin: boolean;
  collection_enabled: boolean;
  publication_enabled: boolean;
  actual_cost: number;
  examinations: { id: string; name: string; name_hi: string }[];
  sources: Source[];
  reviews: Review[];
  revisions: Revision[];
  history: {
    id: number;
    entity_id: string;
    action: string;
    previous_status: string | null;
    next_status: string | null;
    notes: string;
    created_at: string;
  }[];
  report: {
    cadence: string;
    alert_preference: string;
    period_start: string;
    generated_at: string;
    verified_changes: number;
    drafts_awaiting_review: number;
    failures: number;
    stale_sources: number;
    fresh_sources: number;
    owner_approval: number;
    actual_cost: number;
    currency: string;
  };
};
