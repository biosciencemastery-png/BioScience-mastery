# Bioscience Mastery

Public website and Phase 2 authentication preparation for a bilingual biotechnology and life sciences education platform. Built with Next.js App Router, React, TypeScript, and Tailwind CSS. GAT-B is the first planned course. See [Phase 2 setup and approval boundaries](docs/phase-2-setup.md) for database migrations, authentication, and secure configuration.

## What works

- Responsive English and Hindi homepages at `/en` and `/hi`.
- Bilingual navigation, accessible mobile menu, and language switching that preserves the course route.
- Full homepage: hero, course discovery, featured GAT-B, five Coming Soon cards, planned features, exam update empty state, resource previews, FAQs, and footer.
- GAT-B information at `/en/courses/gat-b` and `/hi/courses/gat-b`.
- Honest availability notices, keyboard-operated FAQs, error/404 handling, and default search indexing prevention.
- Automated browser, accessibility, and responsive checks.

## Deliberately not enabled

Authentication is disabled until explicitly configured. Phase 2 migrations and bilingual authentication are prepared locally; hosted database changes and production deployment still require approval. Enrollment, lessons, assessments, launch-alert delivery, AI, and payments are not enabled. Notify Me buttons remain disabled. Resource cards do not claim downloads exist. No examination dates, marking schemes, prices, testimonials, or official affiliations are invented.

## Run on your computer

1. Install **Node.js 24 LTS** and Git.
2. Clone this repository and open its folder in a terminal.
3. Run `npm ci` to install the exact locked dependencies.
4. Run `npm run dev`.
5. Open <http://localhost:3000>. It redirects to the English homepage; choose हिंदी in the header for Hindi.

No external service keys are required for the public website with authentication disabled. `.env.example` documents the Phase 2 placeholders and feature switch. Follow the Phase 2 guide to configure `.env.local`; never commit that file.

## Commands

| Command                                          | Purpose                                                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `npm run dev`                                    | Local editing and preview                                                                       |
| `npm run lint`                                   | Code quality checks                                                                             |
| `npm run typecheck`                              | Route and TypeScript checks                                                                     |
| `npm run build`                                  | Production build                                                                                |
| `npm run start`                                  | Run the built production website                                                                |
| `npx playwright install chromium firefox webkit` | Install test browsers once                                                                      |
| `npm test`                                       | Run browser and accessibility tests against the production build                                |
| `npm run check`                                  | Formatting, lint, types, unit/RLS tests, build, and browser tests with dummy auth configuration |
| `npx playwright show-report`                     | Open the last browser test report                                                               |

Use `npm run check` for the complete suite: it builds and runs with matching dummy authentication configuration. Individual auth browser tests require that same configuration at build and runtime. On Linux, use `npx playwright install --with-deps chromium firefox webkit` to install browser system dependencies. GitHub Actions runs the same checks on pushes to main and pull requests. Browser executables are development dependencies only and are not needed by Vercel.

## Deploy

Follow [the beginner-friendly Vercel guide](docs/deployment.md). Use the Next.js preset, Node.js 24.x, and the repository root. Keep indexing disabled for this Phase 1 review.

## Editing public content

- English: `src/messages/en.json`
- Hindi: `src/messages/hi.json`
- Upcoming course catalogue: `src/content/catalogue.ts`
- Global design styles: `src/app/globals.css`
- Homepage: `src/app/[locale]/page.tsx`
- Course information: `src/app/[locale]/courses/[slug]/page.tsx`

Keep both message files structurally aligned. The typed dictionary checks missing translations during the build. Scientific educational translations still require expert review before publication in future phases. The DNA motif is an original decorative SVG component, not an instructional molecular diagram. Typography uses locally available system fonts, so no external font service is required.

See [architecture](docs/architecture.md), [Phase 1 scope](docs/phase-1.md), and [deployment instructions](docs/deployment.md). No database migrations exist or need to be run in Phase 1.
