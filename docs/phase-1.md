# Phase 1 scope and acceptance

## Implemented scope

- Next.js, React, TypeScript, Tailwind CSS project and lockfile.
- Responsive blue/teal/white design, original decorative DNA motif, accessible controls.
- English/Hindi navigation, full translated homepage and GAT-B course information.
- Homepage includes navigation, hero, Explore Courses, featured GAT-B, five upcoming exam cards, exam notifications, free resources, planned platform features, FAQs, and footer.
- Upcoming cards: CUET-PG, CSIR-UGC NET Life Sciences, GATE Biotechnology, DBT-BET, and relevant PhD entrances.
- Honest empty states, disabled Notify Me with explanation, and no personal-data collection.
- Metadata, preview noindex, sitemap behavior, error and 404 handling.
- CI, browser tests, and beginner-friendly setup/deployment documentation.

## Acceptance checks

Run `npm run check` after browser installation. The browser suite covers English/Hindi pages, course state, no forms, disabled subscriptions, language-preserving navigation, internal URLs and anchors, 404s, default noindex, security headers, mobile menu and Escape handling, keyboard FAQ/skip navigation, automated WCAG checks, and overflow at 320/375/768/1024/1440 pixels. It runs in desktop Chromium, mobile Chromium, desktop Firefox, and mobile WebKit.

Automated accessibility tests do not replace human screen-reader testing. Visual inspection should include desktop/mobile screenshots in both languages. Review deployments require a real Vercel smoke check after configuration.

## Remaining limitations

No backend services or Phase 2 features exist. GAT-B is in preparation; enrollment is closed. No official syllabus, exam dates, prices, or marking rules are claimed. Downloadable resources and lesson content require editorial approval. Hindi scientific course content will require expert review. Brand/business details, contact information, and final policies remain owner inputs for later phases. No external integration is claimed to work.

Phase 2 must not start without separate owner approval.
