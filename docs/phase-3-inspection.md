# Phase 3 inspection and delivery record

Work is confined to `phase-3-student-dashboard`, starting at remote commit `f670a19`. Unfinished older local PKCE edits were preserved in a named Git stash before switching branches; they were not applied wholesale over newer remote changes. Production and `main` are out of scope.

## Existing architecture

Next.js App Router / React / TypeScript serves locale-prefixed English/Hindi routes with shared CSS, header, footer and static public pages. Auth routes are dynamic server components with Server Actions, Supabase SSR cookies, live user verification, and protected account access. Dictionaries provide bilingual public and auth copy. Supabase migrations own profiles, roles, preferences, deletion requests, audit logs, courses/exams and private interest subscriptions. Existing tests include PGlite PostgreSQL/RLS checks, input validation, and Playwright accessibility/navigation/layout checks across four browser configurations.

## Findings before Phase A

- Public cards use a separate hardcoded six-exam catalogue; the user's development database reportedly has nine. No hosted database was queried, and migration deployment is not assumed.
- No notification confirmation, unsubscribe, delivery or abuse-protection workflow exists. Subscription records are private schema preparation only.
- The new remote PKCE implementation chooses recovery routing from a URL/form flag and appends that flag to an otherwise exact redirect URL. Recovery should use the SDK's stored flow information and the already-allowlisted callback path.
- Auth callback validation does not reject provider errors or mixed callback payloads, and success checks do not require a session. No real-provider callback integration tests exist.
- Deletion requests do not display persisted status. Concurrent/repeated requests rely on interpreting a generic unique-constraint error. An own-account, idempotent database operation and persistent status are needed. Requests must never be described as completed account deletion.
- No student dashboard, authoring workflow, published lesson access, profile storage, verified curriculum or assessment data exists yet. Policy URLs and email delivery configuration remain external prerequisites.

Phase A will use database records and database-owned translations/statuses, retain the GAT-B information page without promising lessons, and add private double-opt-in notification delivery. Later phases remain gated on Phase A's automated checks. Live provider acceptance and production-readiness claims require separate evidence.
