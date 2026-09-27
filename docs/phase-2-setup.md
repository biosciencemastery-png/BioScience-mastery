# Phase 2: database and authentication preparation

Prepared on a separate local branch, `phase-2-auth-foundation`. No hosted migrations, production deployment, or Phase 3 work has been performed. The current production website remains unchanged.

## What is prepared

English and Hindi registration, email confirmation, sign-in, password recovery, sign-out, profile editing, and password-verified account deletion requests. Confirmation links open a page requiring a button press, so a mail scanner's GET request does not consume the token. Protected pages validate the user with Supabase Auth; roles come from the database, never editable registration metadata. Session cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Auth pages are dynamic, private/no-store, noindex, and use no-referrer.

Two ordered SQL migrations prepare profiles, student/editor/admin roles, role permissions, notification preferences, deletion requests, minimal audit logs, exam/course catalogue, and consent subscription records. Row-level security and restricted column grants prevent users reading or changing other accounts or granting themselves roles. Subscription records have no browser access. The public Phase 1 catalogue remains file-backed; launch-alert collection and delivery remain disabled. Admin UI, OAuth, lesson delivery, payments, and Phase 3 are not included.

## Environment variables

Copy `.env.example` to `.env.local` in your local checkout. This file is ignored by Git. Enter values locally; do not send keys, passwords, tokens, or `.env.local` through chat or commits.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://zntfsygvhoicxuzkndjv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SB_PUBLISHABLE_KEY
SITE_URL=http://localhost:3000
AUTH_ENABLED=false
ALLOW_INDEXING=false
```

Get the **publishable** key (starts with `sb_publishable_`) from Supabase project settings / API keys. The project URL and publishable key are designed for public application use; access is constrained by RLS. This implementation intentionally rejects legacy JWT keys and secret keys. It needs no service-role key, `sb_secret_` key, database password, JWT signing key, or Supabase management token at runtime.

Set `AUTH_ENABLED=true` only in development or an approved preview after migrations and email configuration are ready. Restart the development server after environment changes. `SITE_URL` must be the exact origin, without `/en`, a trailing path, query, or fragment. HTTPS is required except on localhost/127.0.0.1. Missing or invalid configuration leaves authentication disabled and the public website usable.

For Vercel, open the project's Settings → Environment Variables. Add the same five names, scoped to **Preview** for testing. Use the matching preview origin for `SITE_URL`; use a separate development Supabase project where possible. Do not enable production auth or trigger a production redeployment yet. After approval, Production would use `SITE_URL=https://biosciencemasterycom.vercel.app`, the approved project's public URL/key, and `AUTH_ENABLED=true`. Keep `ALLOW_INDEXING=false` until the site's launch review approves indexing. Environment changes affect subsequent deployments, not an already running deployment. Never put secrets into variables beginning `NEXT_PUBLIC_`.

## Supabase Auth URL configuration

In Authentication → URL Configuration, the eventual Site URL is:

```text
https://biosciencemasterycom.vercel.app
```

A separate development project should instead use `http://localhost:3000`. Site URL is a project-wide fallback; the application explicitly supplies the environment's confirmation URL for signup and recovery.

Add these exact Redirect URLs to the appropriate project when configuring it:

```text
http://localhost:3000/en/auth/confirm
http://localhost:3000/hi/auth/confirm
https://biosciencemasterycom.vercel.app/en/auth/confirm
https://biosciencemasterycom.vercel.app/hi/auth/confirm
```

Both signup and password recovery use these confirmation routes. `/en`, `/account`, and `/reset-password` are not email callback URLs. If manually browsing via `127.0.0.1`, use that exact origin consistently in `SITE_URL` and add its two confirmation URLs too.

For Vercel preview testing, first obtain the stable branch preview alias from the deployment details, then add `https://YOUR-EXACT-PREVIEW-HOST/en/auth/confirm` and its `/hi/auth/confirm` equivalent, and set that preview's `SITE_URL` to the same origin. Use that stable alias for testing: a deployment-specific URL can change on redeploy, leaving email links pointing at an older build. Until an owned stable preview origin is available, keep preview authentication disabled. Do not allow all `*.vercel.app` domains. A future custom domain requires updating both `SITE_URL` and the two allowlisted URLs before testing; do not change it now.

## Required email settings

Enable email/password authentication and **Confirm email**. Set the provider's minimum password length to at least 12, matching the application. Configure a verified sender and custom SMTP in Supabase for real-user delivery; store SMTP credentials only in the provider dashboard. Configure provider rate limits before opening registration publicly. CAPTCHA integration is not included and may be needed for abuse protection.

In Authentication → Email Templates, replace the confirmation anchor in **Confirm signup** with:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=signup"
  >Confirm email / ईमेल की पुष्टि करें</a
>
```

In **Reset password**, use:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery"
  >Reset password / पासवर्ड रीसेट करें</a
>
```

These templates are required for the implemented token-hash flow; keeping the default confirmation URL is not equivalent. The application sets `.RedirectTo` to the correct locale-specific path. Do not configure OAuth callbacks: OAuth is outside this preparation.

## Applying migrations later

Review both files in `supabase/migrations` in filename order. Before applying them, inspect any existing schemas, users, and migration history for conflicts and take an appropriate backup. They create the initial schema, not an automatic merge of arbitrary existing tables. Existing Auth users receive a profile and the student role; metadata cannot create an administrator.

Use Supabase CLI with locally authenticated operator access. For a **separate development project**, initialize CLI configuration if needed (`npx supabase init`), log in interactively (`npx supabase login`), link to that development project, inspect migration history, and review the dry run:

```text
npx supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Do not run the final command against `zntfsygvhoicxuzkndjv` until its intended environment is confirmed and application of its database changes is approved. A production project change is a production change even if the website is not redeployed. CLI access tokens/database passwords belong in local secure operator tooling or a scoped CI secret store, never frontend variables, Vercel application runtime, source control, or chat. No hosted database has been inspected or modified during this preparation.

Create the first admin only through an authorized database operator, using a verified Auth user's UUID:

```sql
insert into public.user_roles (user_id, role)
values ('VERIFIED_AUTH_USER_UUID', 'admin')
on conflict do nothing;
```

Students can request deletion but cannot delete accounts or mark requests complete. An authorized operator must process requests under an agreed retention policy. Audit entries avoid email/password payloads. Define the operator procedure and user support contact before public launch.

## Validation and remaining acceptance checks

`npm ci`, install Playwright browsers, then `npm run check`. The check script supplies dummy local Supabase values and runs formatting, lint, TypeScript, unit tests, actual PostgreSQL RLS tests using PGlite, production build, and browser tests. It never uses the hosted Supabase project. PGlite tests reproduce Auth users/roles/uid but do not run Supabase's Auth service. Browser tests cover public pages, bilingual auth forms, accessibility, mobile widths, anonymous route protection, and confirmation interstitials.

Before approval to launch, test against a configured development project: signup → email confirmation → profile; duplicate email and invalid/expired/replayed links; wrong password and successful login; session refresh and logout; recovery email → new password → sign-in; cross-user access denial; deletion request with correct/incorrect password; real SMTP delivery and rate limits. Verify cookie flags, auth no-store responses, and redirect URLs on the exact Vercel preview. These live-provider checks remain pending because no real key or authenticated project access was supplied. A password reset requests global sign-out; already-issued JWTs may remain valid until expiry.

Keep the feature branch separate from production `main`. Review the changes and successful preview checks before approving production migrations, merging, or deployment. No Phase 3 work is authorized by this preparation.

References: [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [API keys](https://supabase.com/docs/guides/api/api-keys), [Vercel environment variables](https://vercel.com/docs/environment-variables).
