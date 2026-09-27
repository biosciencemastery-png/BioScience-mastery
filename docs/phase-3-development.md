# Phase 3 Development setup

Only use `phase-3-student-dashboard`. Do not merge main or promote a Preview deployment. All hosted migrations and provider configuration are manual; repository migrations are not evidence that a database has been updated.

## Safe database preparation

Use the separate Supabase Development project, not the production project. Verify its project reference in the dashboard before using the SQL editor or linking a CLI. Back up existing Development data. Inspect existing migration history and apply only missing files, in filename order. Do not re-run the original identity migration over an existing database. Compare the nine existing examination/course slugs with `202609280002_exam_catalogue.sql`; map any different slugs before applying it to avoid duplicate records. This migration preserves existing IDs and publication decisions. Never copy production users, passwords or credentials into tests.

Local database tests apply all migrations to isolated PostgreSQL (PGlite). Browser tests use an anonymous catalogue fixture on localhost, not a hosted Supabase project. These tests do not prove hosted configuration or real email delivery works.

## Preview environment variables

In Vercel, open the existing project → Settings → Environment Variables. Select **Preview only**, optionally restrict to `phase-3-student-dashboard`. Enter Development values privately. Do not select Production. For local development, copy `.env.example` to ignored `.env.local`. Never paste keys in chat or commit that file.

| Variable                               | Value / purpose                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Separate Development project URL                                                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Development publishable key                                                                     |
| `SITE_URL`                             | Stable HTTPS Preview origin, without a locale or trailing path; localhost origin locally        |
| `AUTH_ENABLED`                         | Keep `false` until owner approves Development authentication tests                              |
| `CATALOGUE_ENABLED`                    | Set `true` only after catalogue migrations are installed in Development                         |
| `ALLOW_INDEXING`                       | `false`                                                                                         |
| `NOTIFICATIONS_ENABLED`                | Keep `false` until notification migrations and provider setup are verified                      |
| `EMAIL_DELIVERY_ENABLED`               | Keep `false` until owner authorizes real Development email tests                                |
| `SUPABASE_SECRET_KEY`                  | Development server secret; never prefix with `NEXT_PUBLIC_`                                     |
| `RESEND_API_KEY`                       | Sending-only Resend key scoped to the verified domain                                           |
| `NOTIFICATION_FROM_EMAIL`              | Verified sender, for example a mailbox on your own verified domain; placeholder is not a sender |
| `NOTIFICATION_ENCRYPTION_KEY`          | Cryptographically random 32-byte key encoded as 64 hexadecimal characters; server only          |
| `NOTIFICATION_WORKER_SECRET`           | Independently generated random secret of at least 32 characters; server only                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`       | Cloudflare Turnstile site key for approved Preview/localhost hosts                              |
| `TURNSTILE_SECRET_KEY`                 | Matching server-side Turnstile secret                                                           |

Environment changes require a new **Preview** build. Do not promote it. Auth redirect URLs remain `<Preview origin>/en/auth/confirm` and `/hi/auth/confirm`, and the equivalent localhost URLs. Default Supabase email templates use the PKCE callback in the browser that initiated the request. Supabase Auth email delivery and Resend course notifications are separate systems; configuring one does not configure the other.

## Resend setup, after owner approval

1. Create a Resend account and add a domain you control. Publish the DNS records Resend provides and wait for verification. Choose a sender on that domain. No sender or business identity is assumed in this repository.
2. Add the private values above to Development/Preview only. Configure Cloudflare Turnstile for the exact hosts. The widget is validated on the server for hostname and action.
3. After migrations and configuration are checked, enable notifications and email delivery in Development only. Test with a mailbox you control, in English and Hindi. Confirming and unsubscribing require a button press; email scanners opening links do not consume them.
4. Arrange an authenticated scheduler to **POST** `/api/notifications/deliver` with `Authorization: Bearer <worker secret>`. Keep its secret in the scheduler's secret store. No scheduler is automatically enabled. Each call processes at most ten emails and queues at most 100 newly eligible launches; repeat until drained.
5. Confirm a subscription, repeat the request to verify deduplication, test an expired confirmation, and unsubscribe using both older and newer email links. Publishing a real course queues launch mail only for confirmed subscribers. Do not publish dummy educational content to test this in production.

To pause sending, set `EMAIL_DELIVERY_ENABLED=false` while keeping `NOTIFICATIONS_ENABLED=true`, so existing unsubscribe links continue working. Pending encrypted messages expire for delivery after 23 hours; confirmation links expire after 24 hours. Retries use a stable Resend idempotency key and a database lease. A message already accepted by the provider cannot be recalled during an unsubscribe race. Before public launch, configure provider bounce/complaint monitoring and approve a retention/deletion policy for subscriptions, rate-limit buckets, token hashes and job records. Failed jobs require operator review; they are not retried indefinitely. Rotate encryption keys only after draining/cancelling old encrypted jobs.

## Policy information still needed

- Responsible owner/legal entity name and applicable jurisdiction.
- Public support/privacy contact email and a process for rights/deletion requests.
- Intended audience, age requirements and handling of minors.
- Exact data retention and deletion timelines, backup handling and any lawful exceptions.
- Final vendors, processing locations, cookies/analytics choices and purposes.
- Educational-material ownership/licensing, acceptable use, and any future payment/refund terms.
- Owner/legal review of both languages, final publication date and version identifiers.

Draft templates are not legal advice or published policies. Registration must remain closed until the actual texts are reviewed, finalized and published. No business registration, address, compliance claim or retention promise should be invented to fill these gaps.
