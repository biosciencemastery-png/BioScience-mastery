# Bioscience Mastery

Phase 1 public website for a bilingual biotechnology and life sciences education platform. Built with Next.js App Router, React, TypeScript, and Tailwind CSS. GAT-B is the first planned course.

## What works

- Responsive English and Hindi homepages at `/en` and `/hi`.
- Bilingual navigation, accessible mobile menu, and language switching that preserves the course route.
- Full homepage: hero, course discovery, featured GAT-B, five Coming Soon cards, planned features, exam update empty state, resource previews, FAQs, and footer.
- GAT-B information at `/en/courses/gat-b` and `/hi/courses/gat-b`.
- Honest availability notices, keyboard-operated FAQs, error/404 handling, and default search indexing prevention.
- Automated browser, accessibility, and responsive checks.

## Deliberately not enabled

No database, authentication, enrollment, lessons, assessments, subscriptions, email sending, AI, or payments. Notify Me buttons are disabled with a visible explanation. No form collects personal information. Resource cards do not claim downloads exist. No examination dates, marking schemes, prices, testimonials, or official affiliations are invented. Phase 2 requires separate owner approval.

## Run on your computer

1. Install **Node.js 24 LTS** and Git.
2. Clone this repository and open its folder in a terminal.
3. Run `npm ci` to install the exact locked dependencies.
4. Run `npm run dev`.
5. Open <http://localhost:3000>. It redirects to the English homepage; choose हिंदी in the header for Hindi.

No environment variables or external service keys are required for Phase 1. `.env.example` documents the optional site URL and indexing switch. If needed, copy it to `.env.local`; never commit that file.

## Commands

| Command                                          | Purpose                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `npm run dev`                                    | Local editing and preview                                        |
| `npm run lint`                                   | Code quality checks                                              |
| `npm run typecheck`                              | Route and TypeScript checks                                      |
| `npm run build`                                  | Production build                                                 |
| `npm run start`                                  | Run the built production website                                 |
| `npx playwright install chromium firefox webkit` | Install test browsers once                                       |
| `npm test`                                       | Run browser and accessibility tests against the production build |
| `npm run check`                                  | Lint, types, production build, then tests                        |
| `npx playwright show-report`                     | Open the last browser test report                                |

Build before running tests. On Linux, use `npx playwright install --with-deps chromium firefox webkit` to install browser system dependencies. GitHub Actions runs the same checks on pushes to main and pull requests. Browser executables are development dependencies only and are not needed by Vercel.

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
