# Phase 5 — review-first examination information foundation

Branch: `phase-5-automation-foundation`, based on verified Phase 4 commit `2ecc35a8ad5d039def3230689d2cfd5a18a2bfe5`.

## Architecture and scope

The existing Next.js, Supabase session cookies, live user verification, examination catalogue, EN/HI routing and semantic theme variables are reused. Private routes are `/en/admin/automation` and `/hi/admin/automation`; they are dynamic, non-indexable and served with private/no-store headers. Nothing is added to student navigation.

This is a **manual Development collection foundation**, not an activated website crawler. An administrator supplies bounded text captured from an approved source, or a retrieval failure description. The database records the capture timestamp and `manual_development` provenance. It does not independently verify that text was fetched from the URL. Human verification of the original is mandatory. No outbound collector, scheduler, AI provider, email provider or notification provider is implemented or invoked.

Server actions validate with Zod; database commands independently check current `user_roles`, input constraints, optimistic version numbers and workflow states. No service key is needed by the staff interface. Role metadata supplied during signup is never trusted.

## Database migration

New migration: `supabase/migrations/202609300001_automation_foundation.sql`.

| Table                                | Purpose                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `private.automation_config`          | Operator-controlled collection/publication kill switches; both false                                           |
| `private.automation_allowed_origins` | Exact approved HTTPS origins and operator review notes; initially empty                                        |
| `automation_sources`                 | Existing examination FK, URL, source type, verification, activity, licensing, freshness inputs and fingerprint |
| `automation_jobs`                    | Idempotency keys, five-minute leases, owner, attempt limit, timestamps and results                             |
| `automation_evidence`                | Immutable per-attempt URL/licensing/text/fingerprint snapshots; initial, changed or failure records            |
| `automation_reviews`                 | Versioned review state and explicit human verification/category                                                |
| `automation_revisions`               | Append-only draft revisions, evidence lineage, language, reuse attestation and attribution                     |
| `automation_decisions`               | Append-only approval/rejection/publication decisions tied to an exact revision                                 |
| `automation_history`                 | Append-only actor, transition, time and reason history                                                         |

All new public tables have RLS. Anonymous users have no table/RPC access; students see no rows and cannot invoke staff RPCs. Staff have SELECT only; mutations go through `automation_command`. Configuration and origin allowlisting are inaccessible to browser roles. Authors/actors become null when their Auth user is deleted; the historical text and decisions remain. Review retention and account-deletion treatment require owner/legal review before production.

**No hosted migration was executed.** Reconcile the Development migration ledger against every repository migration first, particularly the Phase 4 registration gate and roles. Do not blindly reapply migrations to an existing database or assume its schema matches this branch. Back up Development and inspect differences before any later approved migration run. Production is out of scope.

## Registry and collection

No real official sources are seeded: authenticity and reuse rights require owner review. An operator must verify the exact public HTTPS origin outside the application, then insert it into the private allowlist. Administrators can register/manage sources within that allowlist. URL, exam and source type are immutable after registration; deactivate and register another source for a URL change. Verification requires explanatory notes, and every source retains licensing notes. Query strings, credentials, fragments and custom ports are unsupported. Source freshness defaults to seven days after the last successful capture; never-checked active sources are stale for reporting.

Collection requires an administrator, an active verified source, the database collection switch, `AUTOMATION_ENV=development`, `AUTOMATION_MANUAL_ENABLED=true`, a localhost/127.0.0.1 `SITE_URL`, and no Vercel production/preview environment. The application defaults remain disabled.

Each manual form submission carries an idempotency UUID. Claiming creates or leases a job for five minutes. Active leases cannot be stolen; completion checks token, actor and expiry. Repeated successful keys return the existing outcome. Failed/expired jobs may be reclaimed up to three attempts with the same key; retries are explicit, not scheduled. The database hashes bounded source text with SHA-256 after CRLF/CR normalization and trimming outside spaces. Unchanged text updates timestamps and job history without creating another evidence/review item. A change retains the previous fingerprint. Failure attempts retain evidence without replacing the last successful fingerprint.

Do not paste private student data, passwords, consent records, full copyrighted publications or secrets into evidence. This phase stores at most 12,000 characters per capture; it does not extract PDFs, run HTML or infer dates. A future network adapter needs separate SSRF/DNS/private-address/redirect checks, response limits, MIME validation, robots/terms review and permission to activate. Registry validation alone must never be treated as safe authorization for arbitrary fetching.

## Review and approval

`detected → needs_review / verified → draft → approved → published`

- Editors and administrators can triage an item with a reason, explicitly verify non-failure evidence, classify ambiguity/contradiction, and prepare EN/HI draft revisions.
- Retrieval failures cannot be verified as examination information. A later successful capture must create separate evidence.
- Drafts require verified evidence, licensing notes and a positive reuse attestation. They render as plain text with a BioScience Mastery summary disclaimer; they do not imply official endorsement.
- Only administrators approve or reject. Decisions reference the exact immutable revision and record a reason and actor. A new revision of an approved draft returns it to `draft`; the old approval is preserved and cannot authorize the new revision.
- Rejected items may return to review. Published items cannot be edited through this workflow; new evidence is required.
- The publication RPC is separately gated false. There is **no publication button, automatic publication, public read policy or public rendering integration** in this phase. Even a future operator-enabled publication transition remains staff-only until separately approved public integration exists.
- Editors cannot manage sources, approve/reject publication, change roles or enable services. Administrators cannot change global switches or allowlisted origins through the application.

The dashboard shows the latest 100 sources, review items, revisions and audit events. Report totals include all records. Full pagination, archival search and public publication are follow-up work; this bounded interface is intended for the initial review workload.

## Daily report, important-only alerts and costs

The dashboard RPC returns a consolidated DAILY UTC snapshot: changes verified today, current draft backlog, failed jobs, stale/never-checked sources, fresh sources and items requiring owner approval. It is generated on demand; no background report is scheduled or sent. Important-only candidates are explicitly classified security incidents, owner-approval items, or human-verified deadline changes. Routine notices/unchanged captures stay quiet. Rejected items do not alert. No notification dispatch exists.

Actual external automation/AI cost is zero because this implementation has no external-service transport. This is not a statement about the owner's hosting bill. The immutable AI policy defaults off with zero per-request/daily/monthly/approved budgets and requires future cache/deduplication controls. Every proposed request is denied, including public evidence; private-profile, password, consent and unpublished-licensed classifications are rejected explicitly. There is no environment flag that activates AI. Future provider code requires separate data-minimization, budget accounting, caching, rights and security review.

## Safe local Development testing

1. Keep real `.env.local` auth, registration, email and notification flags unchanged/disabled. Never supply production credentials.
2. Dependencies already installed: `npm run check:phase5` runs format, lint, type generation/TypeScript, unit tests, isolated PGlite RLS tests, a production build and only the new automation browser tests.
3. Browser tests launch a loopback-only fake Auth service and a fresh PGlite database with the real migrations. Only that disposable fixture enables manual collection and creates synthetic staff users/origins. The app still performs live Auth lookup and real SQL role/workflow checks. No hosted Supabase project is contacted. Test credentials are synthetic and have no validity elsewhere.
4. For an interactive **local fixture only**, after a successful fixture build run `node node_modules/tsx/dist/cli.mjs scripts/automation-fixture.ts`; in a second terminal start Next with the same localhost-only variables in `playwright.automation.config.ts`. Use `admin@example.test` or `editor@example.test`, password `fixture-password-only`, then open `/en/admin/automation`. Stop both processes afterward. Never deploy the fixture or copy these test accounts into a real database.
5. A real Development project requires a separately reviewed migration reconciliation, approved operator allowlist entries and staff provisioning. Do not enable hosted authentication or services as part of this phase. An owner-approved future local-to-Development test may temporarily enable the two collection gates; set `manual_collection_enabled=false` and `AUTOMATION_MANUAL_ENABLED=false` immediately afterward. Turning off the database gate blocks even a leased job's completion.

## Owner / legal / security review before any activation

- Verify each official source, ownership, permitted excerpts, translations, summaries and reuse conditions; no implied endorsement or guessed examination facts.
- Approve staff identities, retention/deletion policy, revision/audit access and recovery/backup procedures.
- Review the database migration ledger and run separate hosted Development integration tests after explicit authorization. PGlite does not prove hosted Auth, PostgREST or deployment configuration.
- Any future network collector, scheduler, public publication endpoint, provider, notifications or AI integration needs explicit approval, security tests and its own activation plan. Production switches remain off; no paid service credentials are needed now.
