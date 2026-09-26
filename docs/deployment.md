# Deploy Phase 1 to Vercel

## Before you begin

You need a GitHub account with access to this repository and a Vercel account. No Supabase, email, payment, or AI account is needed for Phase 1. Review Vercel's current plan terms and usage limits for your intended commercial use; this guide does not assume a free plan is suitable.

## First deployment

1. Ensure the tested Phase 1 commit appears in `biosciencemastery-png/BioScience-mastery` on GitHub.
2. Sign in to [Vercel](https://vercel.com) and choose **Add New → Project**.
3. Connect GitHub if requested. Give Vercel access to this specific repository, then select **Import** beside it. If it is missing, edit the Vercel GitHub app's repository access using the repository owner's account.
4. Keep the **Root Directory** at the repository root (`./`).
5. Select **Next.js** as the framework preset. Use **Node.js 24.x**.
6. Build command: `npm run build`. Install command: `npm ci`. Leave the output directory at the Next.js default; do not select `out`.
7. Set `ALLOW_INDEXING` to `false` for both Preview and Production. It is also false by default. This is a public preview, not the completed learning platform.
8. `SITE_URL` is optional. Once your deployment URL or custom domain is known, set it to that HTTPS origin, for example `https://your-site.vercel.app`, with no trailing slash. The application can use Vercel's production project URL when this is omitted.
9. Click **Deploy**. Wait for the build to finish and open the provided URL.
10. Visit `/en`, `/hi`, `/en/courses/gat-b`, and `/hi/courses/gat-b`. Check the mobile menu, language switch, FAQ, course link, and unavailable subscription notice.

Vercel runs the production build; browser tests run in GitHub Actions. Keep the GitHub checks passing before promoting changes. This repository is configured for deployment but that does not mean a Vercel project or live URL has already been created.

## After the first deployment

- In Vercel's Git settings, use `main` as the production branch. Branches and pull requests can generate review deployments.
- For a custom domain, open **Project → Settings → Domains**, add your domain, and apply the DNS records Vercel shows. Wait for verification and HTTPS before testing it.
- Update `SITE_URL` to the verified domain and redeploy.
- Changing environment variables requires a new deployment to update generated metadata.
- Keep `ALLOW_INDEXING=false` through Phase 1. It sets noindex metadata, disallows crawling, and leaves the sitemap empty. This is not access control: use Vercel deployment protection if the preview must be private.
- Enable indexing only after the owner approves public launch, content and policies are ready, and the canonical HTTPS domain is configured. Preview environments remain noindex even if the switch is enabled.
- To roll back, use Vercel's deployment history to promote a previously verified deployment. Do not delete repository history.

## Troubleshooting

| Problem                | What to check                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Repository missing     | Vercel GitHub app access and the GitHub account's repository permissions                                |
| Build fails            | Read the first actual error in the build log; confirm Node 24.x, root directory, and committed lockfile |
| Old content            | Confirm the deployment's Git commit and whether the current production URL points to it                 |
| Blank or missing route | Test `/en` directly and inspect the build log; do not change output directory to a static export        |
| Tests fail locally     | Run `npm run build`, install the Playwright browsers, and stop any old server on port 3000              |
| Notify Me does nothing | Expected in Phase 1: subscriptions require Phase 2 and explicit approval                                |

Never paste secret credentials into the README, source files, screenshots, or chat. Future secrets belong in provider dashboards and local ignored environment files.

Official reference: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).
