# Future Phase 5 automation — design only

Owner preferences: **DAILY** consolidated administrator report; approval notifications **IMPORTANT ONLY**. No scheduler, email delivery, paid agent or API is enabled by this document.

Use a single small orchestration workflow before considering multiple agents. A future scheduler may inspect an allowlist of official examination sources at a conservative frequency. Store source URL, retrieval time, content fingerprint and evidence of changes; deduplicate unchanged pages. Failed requests, ambiguous dates and contradictory official notices go to a review queue. Never publish guessed examination patterns, invented PYQs or unlicensed materials.

Separate collection, draft preparation, human review and publication. A draft must retain its source evidence, language, verification status, licensing information and revision history. Translating or summarizing a notice must not imply it was officially endorsed. Administrators approve publication; editors may prepare/review drafts but cannot assign roles or activate services. Database policies and server checks must enforce those boundaries, with auditable status transitions and immutable approval records.

Start with deterministic parsing, manual drafting and zero external AI calls. Any later AI integration must default to disabled, have a hard daily/monthly budget of zero until approval, enforce per-request limits, cache/deduplicate work, redact personal data and stop on uncertain cost estimates. Do not assume free-tier availability or connect eight paid agents. No student passwords, private profiles, consent records or unpublished licensed material should be sent to model providers without an independently reviewed purpose and authorization.

The daily report should summarize verified changes, drafts awaiting review, failures, source freshness and actual cost (zero while disabled). Send immediate approval notifications only for important items such as verified deadline changes, security incidents or a publication that explicitly needs owner approval. Routine unchanged monitoring stays quiet. Delivery channels and credentials are future configuration, not present integrations.

Before activation: approve sources and licenses, implement idempotent jobs with leases/retries and a kill switch, test permissions, review retention and privacy, select an approved notification channel, and document operator recovery. Production scheduling requires a separate owner approval.
