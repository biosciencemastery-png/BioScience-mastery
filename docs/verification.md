# Phase 1 verification

Verified on 27 September 2026 against the production build.

| Check                                            | Result                         |
| ------------------------------------------------ | ------------------------------ |
| Clean dependency installation (`npm ci`)         | Passed                         |
| Formatting (`npm run format:check`)              | Passed                         |
| Lint (`npm run lint`)                            | Passed                         |
| TypeScript and route types (`npm run typecheck`) | Passed                         |
| Production build (`npm run build`)               | Passed                         |
| Browser suite (`npm test`)                       | 44 passed, 0 failed, 0 skipped |
| Dependency audit during installation             | 0 reported vulnerabilities     |
| Git whitespace checks                            | Passed                         |

Browser projects: desktop Chromium, mobile Chromium, desktop Firefox, and mobile WebKit. Playwright and playwright-core are pinned together at 1.58.2. Tests ran with one worker on Windows.

Coverage includes English/Hindi homepages and GAT-B pages, all homepage sections, truthful availability notices, disabled subscriptions, absence of data-collection forms, working links and anchors, locale switching, 404 handling, review noindex behavior, security headers, mobile menu/Escape handling, skip link and FAQ activation, and overflow checks at 320, 375, 768, 1024, and 1440 pixels.

Automated accessibility scans passed for all four public pages in every browser project. Windows WebKit uses same-page axe analysis because the isolated analysis tab crashes in that environment; Phase 1 contains no frames. Desktop projects test native first-Tab access to the skip link. Mobile projects focus the link explicitly before testing keyboard activation, accounting for mobile Safari's native Tab policy. These checks do not replace a human screen-reader review.

Desktop and mobile screenshots in both languages were visually reviewed during implementation. A live Vercel deployment still requires the owner to configure the project and run the deployment smoke checks in `deployment.md`.

No Phase 2 functionality is implemented. Database, authentication, enrollment, subscriptions, payments, and AI remain unavailable pending separate approval.
