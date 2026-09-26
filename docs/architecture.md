# Architecture and phase boundaries

## Current implementation

A single Next.js App Router application serves static English/Hindi public pages. The locale layout owns the HTML language, navigation, footer, and shared metadata. Server components render page content; the mobile header and error boundaries use small client components. Native details/summary provides FAQs without additional JavaScript. The root proxy redirects `/` to `/en`.

ESLint is pinned to 9.39.5 because the current Next.js React lint plugin uses APIs removed in ESLint 10. Upgrade it together with a compatible plugin release. This is development tooling, not browser code.

Messages are centralized in typed English/Hindi dictionaries. Initial upcoming course data is configuration, not a pretend database. The course route accepts only `gat-b`; unknown slugs and unsupported locales return 404. Original decorative vector illustrations have no external asset or font dependency. Tailwind's style pipeline and shared CSS tokens define the visual system.

`SITE_URL` controls canonical URLs. `ALLOW_INDEXING` defaults off and is always off for Vercel Preview environments. Nothing in Phase 1 requires credentials or stores student data. Security headers block framing, disable MIME guessing, and restrict unused browser capabilities.

## Planned architecture (not implemented)

- Supabase Auth, PostgreSQL, and row-level policies in Phase 2.
- Student-owned enrollments, progress, and preferences in Phase 3.
- Versioned Examination → Section → Subject → Unit → Chapter → Topic → Lesson content, with reviewed translations, in Phase 4.
- Protected answer keys and immutable test/marking snapshots in Phase 5.
- Official-source evidence, human verification, and permitted retrieval jobs in Phase 6.
- Draft-only AI generation, editorial approval, usage limits, and audit history in Phase 7.
- Server-verified payments, repeat-safe events, entitlements, and refunds in Phase 8.
- Broader security, recovery, performance, and launch verification in Phase 9.

The approved relational design covers profiles/roles, examinations/years/sources, courses/prices, curriculum/lesson versions/translations, enrollments/entitlements/progress/bookmarks, question/test versions/attempts/responses, orders/payments/refunds, source verification, consent/subscriptions, AI drafts/approvals, jobs and audit logs. Add migrations only as their phase is approved. No migrations are present in Phase 1.

Public policy and contact pages require accurate owner/business information and review before data collection or payments. They are not linked as if complete. Header links use real homepage sections. Authentication, dashboards, purchases, and other future routes are not exposed as working functionality.

Each phase requires a changed-file report, tests/results, limitations, external configuration instructions, and an owner approval gate before the next phase.
