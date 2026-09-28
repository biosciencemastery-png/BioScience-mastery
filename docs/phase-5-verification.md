# Phase 5 verification

Validated on local branch `phase-5-automation-foundation`, based on `2ecc35a8ad5d039def3230689d2cfd5a18a2bfe5`. No hosted migrations, production changes, external-service activation or remote push were performed.

The targeted database tests exercise the real repository migrations in isolated PGlite. Browser tests use synthetic loopback Auth responses and execute the real automation SQL/RLS; they do not validate hosted Supabase Auth or PostgREST.

## Results

| Check                  | Actual result                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check` | Passed, all matched files formatted; final edited files also checked/formatted separately                                 |
| `npm run lint`         | Passed; targeted ESLint passed again for the URL validation, page and browser-test fixes                                  |
| `npm run typecheck`    | Passed, including Next route generation                                                                                   |
| `npm run test:unit`    | 21 passed initially; one new URL test failed and passed after its targeted rerun. All 22 cases now pass across those runs |
| `npm run test:db`      | 23 passed, 0 failed (17 existing + 6 Phase 5)                                                                             |
| `npm run build`        | Passed; rebuilt successfully after the skip-link target fix, including TypeScript                                         |
| Targeted Playwright    | All 8 cases passed across the initial run and the six-case continuation described below                                   |

The first browser run passed the two Chromium access-denial cases, then a workflow test timed out on a label locator before submission. The run was stopped to avoid repeating the same failure. A role-based combobox locator fixed the test. The six affected/not-yet-run cases then passed with:

```text
npm run test:automation -- --grep "admin collection|desktop-firefox|mobile-webkit" --max-failures=1
6 passed (1.7m)
```

Coverage: desktop Chromium, mobile Chromium, desktop Firefox and mobile WebKit. Each engine covers anonymous/student access denial and administrator collection → editor verification → Hindi draft → administrator approval. Workflow tests also check the existing keyboard skip link, private/no-store response, absence of editor approval controls and public publication buttons, responsive overflow, persisted dark theme and an axe scan of the new main content (zero violations). There was no full previous-phase browser-suite rerun.

Issues fixed during implementation: an ambiguous SQL variable in the source allowlist query; URL dot-segment normalization bypass; missing skip-link target in the new page; an incorrect browser test label locator. Failed-job retries retain separate per-attempt evidence, and revoked origin approvals block subsequent claims/completions.

## Security coverage and limits

Database tests cover disabled defaults, anonymous/student data denial, editor restrictions, unauthorized role writes, operator-only configuration, source allowlisting, SHA-256 normalization/deduplication, idempotent replay, owned/expiring leases, three-attempt limits, collection kill switch, human verification, exact-revision approval, stale-version rejection, approval invalidation on edit, immutable history/evidence/decisions and blocked publication. Failure evidence cannot become verified examination information. Unit tests cover important-only classification and unconditional zero-budget AI denial.

PGlite tests prove these SQL checks locally, not hosted Supabase configuration. Browser Auth is synthetic; hosted email confirmation, real staff provisioning, migrations, source authenticity, licensing and live source retrieval remain untested/unactivated. Collection is manual supplied-text capture only; there is no outbound collector or production scheduler. No actual examination dates/content were invented.

## Changed files

- `.env.example`, `package.json`, `src/proxy.ts`
- `src/app/[locale]/admin/automation/page.tsx`
- `src/app/[locale]/admin/automation/automation.css`
- `src/features/automation/actions.ts`
- `src/features/automation/forms.tsx`
- `src/features/automation/messages.ts`
- `src/features/automation/model.ts`
- `src/features/automation/server.ts`
- `supabase/migrations/202609300001_automation_foundation.sql`
- `tests/helpers/automation-db.ts`
- `tests/database/automation.test.ts`
- `tests/unit/automation.test.ts`
- `tests/e2e/automation.spec.ts`
- `playwright.automation.config.ts`
- `scripts/automation-fixture.ts`
- `scripts/check-phase5.mjs`
- `docs/phase-5-implementation.md`
- `docs/phase-5-verification.md`

## Before owner-approved Development activation

Follow `docs/phase-5-implementation.md`: reconcile the migration ledger, review source ownership/reuse, provision staff through an operator, and approve retention/audit handling. Keep public authentication/registration and all delivery/AI/scheduler services disabled. The new migration has not been applied to any hosted project. Public publication is not implemented; even an operator-enabled publication record remains staff-only.

Main, earlier branches and existing PRs were not modified or merged. This work is for a local Phase 5 commit only; no push or deployment is authorized.
