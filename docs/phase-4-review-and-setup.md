# Phase 4: review and Development verification

Branch: `phase-4-auth-profile-legal-theme`, based on existing theme commit `1e103a9`. No earlier branch, PR, production environment or hosted database is changed by this work. Authentication and notification delivery remain disabled in the example configuration. No payments or paid APIs are implemented.

## What requires migration

Review `202609290001_student_profiles_and_legal.sql` after all earlier repository migrations. It adds optional academic profiles, examination goals, immutable published policy versions, private acceptance records, marketing preference fields and an initially closed database registration gate. Existing accounts are not assigned fabricated consent. They retain login/profile/deletion-request functionality. Profile saving uses an own-user transactional database function; students cannot grant roles, write acceptances or publish policies.

Before applying anything to the separate Development project, compare its migration history, tables, functions, triggers, RLS and examination slugs with the repository. The earlier catalogue migration needs special attention if nine examinations were manually created with different slugs. Back up Development data. Apply only genuinely missing migrations in order; do not assume the hosted schema matches Git. No hosted migration was executed by implementation. Automated tests use isolated in-memory PostgreSQL only.

**The new Auth insert trigger intentionally rejects every new signup while the database gate is closed**, including direct Supabase API calls, invitations and other provisioning methods. Existing sign-in is unaffected. Do not apply it to production without reviewing this behavior. When the owner later approves registration, the operator must first publish reviewed EN/HI Terms and Privacy versions, configure email confirmation, and explicitly enable both the private database gate and `REGISTRATION_ENABLED`, as well as `AUTH_ENABLED`. Neither clients nor application users have permission to open the database gate.

Signup metadata carries only the submitted optional details, goals and consent version IDs to the Auth transaction. Passwords go only to Supabase Auth. The trigger verifies current published policies, captures authoritative records atomically and removes the temporary profile/consent metadata copy. A failure rolls back new account creation; an email delivery failure never produces a claimed confirmed account. Duplicate-account responses remain generic. Retry/provider behavior and expired confirmation links must still be verified against Development Supabase before enabling signup. No consent is fabricated for pre-existing accounts.

## Legal review — unresolved launch blockers

All fallback website documents are **DRAFT / REVIEW REQUIRED**, version `2026-09-28-draft`, with no effective date. They describe an individual operator, not a registered company. Support defaults to `biosciencemastery@gmail.com`; override `SUPPORT_EMAIL` privately if needed. Readable EN/HI pages exist for Terms, Privacy and Refund Policy. The database is deliberately not seeded with supposedly approved policies.

The owner and qualified legal reviewer must finalize:

- Operator's legal name, address, jurisdiction, grievance/contact responsibilities and dispute process.
- Eligibility/minors rules and any guardian-consent process. No date of birth or identity document collection is introduced.
- Data retention, backups, deletion response procedure, provider locations and international transfers. Profile photos are not implemented in Phase 4 and must not be claimed as active.
- Future paid-course prices, taxes, access duration, cancellations, course withdrawal and mandatory consumer remedies.
- Refund proposal boundaries: `0 ≤ t ≤ 1h`: 100%; `1h < t ≤ 2h`: 75%; `2h < t ≤ 3h`: 60%; `3h < t ≤ 4h`: 40%; `4h < t ≤ 5h`: 20%; later: normally 0%, subject to mandatory rights. The proposed clock runs from successful payment to receipt of the request. This interpretation is explicitly for approval, not an active promise.
- Whether the percentage base includes taxes, and who bears gateway fees. No deduction is authorized by the draft. Define working days, timezone, proof of request receipt and approval procedure. Seven working days is the proposed processing target **after approval**; bank credit timing varies.

Razorpay is planned, not active. Its [merchant terms](https://razorpay.com/terms/) distinguish merchant fees from refunds; that does not itself decide what may be deducted from a customer's refund. Review applicable [consumer protection legislation](https://www.indiacode.nic.in/bitstream/123456789/16939/1/a2019-35.pdf) with counsel before a paid launch. The draft does not claim statutory compliance or waive mandatory rights.

For publication, use new immutable rows in `legal_policy_versions` for each kind/language: final plain-text body, unique version, actual review timestamp and future or current effective timestamp. The website renders paragraph blocks whose first line is a section heading. Mark exactly one approved version current for each kind/language; never overwrite a published body. Public pages and signup read the same effective database versions. Changing `REGISTRATION_ENABLED` alone cannot bypass the database gate or missing consent. Establish a separate reviewed re-acceptance process before changing policies for existing users; Phase 4 does not silently overwrite prior acceptance.

## Preview checks — no deployment performed

1. Use only the existing Phase 4 Preview branch/environment, with separate Development Supabase values. Keep `AUTH_ENABLED=false`, `REGISTRATION_ENABLED=false`, `NOTIFICATIONS_ENABLED=false`, `EMAIL_DELIVERY_ENABLED=false` and `ALLOW_INDEXING=false` until explicit approval to test services. Do not promote Preview.
2. Review EN/HI Terms, Privacy and Refund pages, all three registration steps, untouched consent defaults and the disabled signup button. The wizard keeps values only in the current page; passwords are not written to localStorage or academic records.
3. Test light/dark mode, reload persistence, OS preference when no manual choice exists, keyboard use, mobile navigation and reduced motion. A fixed inline head script sets the theme before paint; only the HTML theme attribute suppresses its expected hydration difference. If a strict CSP is introduced later, authorize this exact script by hash or nonce rather than enabling arbitrary inline scripts.
4. After separate approval and schema reconciliation, test existing Development accounts' optional academic details, goals, language, marketing preference and deletion requests. No email/password should be included in screenshots or logs. Test new signup only after actual reviewed policies and both signup gates are configured.
5. Verify in Development that missing/stale consent rolls back signup, valid consent creates two immutable acceptance records, email confirmation is required, duplicate emails receive generic responses, and another user's private records are inaccessible. Local mocked/in-memory tests do not replace these hosted acceptance checks.

No automatic email, payment, background worker or AI service is activated by these steps unless explicitly configured and approved in a later task.
