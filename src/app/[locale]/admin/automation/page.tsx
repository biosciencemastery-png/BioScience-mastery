import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { automationStaff } from "@/features/automation/server";
import {
  importantAlert,
  manualCollectionAllowed,
} from "@/features/automation/model";
import { automationMessages } from "@/features/automation/messages";
import {
  CollectionForm,
  ReviewForms,
  SourceForm,
} from "@/features/automation/forms";
import "./automation.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Automation review | BioScience Mastery",
  robots: { index: false, follow: false },
};
export default async function AutomationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { dashboard: d } = await automationStaff(locale),
    m = automationMessages[locale];
  if (!d)
    return (
      <main id="main" tabIndex={-1} className="container section">
        <h1>{m.title}</h1>
        <p role="alert">{m.unavailable}</p>
      </main>
    );
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(value)) + " UTC"
      : m.never;
  const states = m.states as Record<string, string>,
    categories = m.categories as Record<string, string>;
  return (
    <main id="main" tabIndex={-1} className="container section automation">
      <div className="automation-heading">
        <div>
          <p>BioScience Mastery · {d.is_admin ? "Admin" : "Editor"}</p>
          <h1>{m.title}</h1>
          <p>{m.subtitle}</p>
        </div>
        <Link
          href={`/${locale === "en" ? "hi" : "en"}/admin/automation`}
          lang={locale === "en" ? "hi" : "en"}
        >
          {locale === "en" ? "हिन्दी" : "English"}
        </Link>
      </div>
      <aside className="automation-notice">{m.disabled}</aside>
      <nav aria-label={m.title}>
        {[
          ["sources", m.sources],
          ["queue", m.changes],
          ["drafts", m.drafts],
          ["report", m.report],
          ["history", m.history],
        ].map(([id, title]) => (
          <a key={id} href={`#${id}`}>
            {title}
          </a>
        ))}
      </nav>
      <div className="automation-grid">
        <section className="automation-panel">
          <h2>{m.status}</h2>
          <p>
            {m.collection}:{" "}
            {d.collection_enabled && manualCollectionAllowed() ? m.on : m.off}
          </p>
          <p>
            {m.publication}: {d.publication_enabled ? m.on : m.off}
          </p>
        </section>
        <section className="automation-panel">
          <h2>{m.cost}</h2>
          <strong className="automation-number">₹{d.actual_cost}</strong>
          <p>AI: {m.off}</p>
        </section>
        <section className="automation-panel">
          <h2>{m.failures}</h2>
          <strong className="automation-number">{d.report.failures}</strong>
          <p>
            {m.stale}: {d.report.stale_sources}
          </p>
        </section>
      </div>
      <section id="sources" className="automation-panel">
        <h2>{m.sources}</h2>
        {d.is_admin && (
          <details>
            <summary>{m.add}</summary>
            <SourceForm locale={locale} exams={d.examinations} />
          </details>
        )}
        {!d.sources.length && <p>{m.empty}</p>}
        <div className="automation-grid">
          {d.sources.map((s) => (
            <article className="automation-record" key={s.id}>
              <h3>{s.name}</h3>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.url}
              </a>
              <p>
                {m.verification}: {states[s.verification_status]}
              </p>
              <h4>{m.freshness}</h4>
              <p>
                {(m.freshnessLabels as Record<string, string>)[s.freshness]}
              </p>
              <p>
                {m.lastChecked}: {date(s.last_checked_at)}
              </p>
              <p>
                {m.lastSuccess}: {date(s.last_success_at)}
              </p>
              <p>
                {m.licensing}: {s.licensing_notes}
              </p>
              {d.is_admin && (
                <details>
                  <summary>{m.edit}</summary>
                  <SourceForm
                    locale={locale}
                    exams={d.examinations}
                    source={s}
                  />
                </details>
              )}
            </article>
          ))}
        </div>
        {d.is_admin && d.collection_enabled && manualCollectionAllowed() && (
          <details>
            <summary>{m.collect}</summary>
            <CollectionForm
              key={randomUUID()}
              locale={locale}
              sources={d.sources}
              requestId={randomUUID()}
            />
          </details>
        )}
      </section>
      <section id="queue" className="automation-panel">
        <h2>{m.changes}</h2>
        <p>{m.limited}</p>
        {!d.reviews.length && <p>{m.empty}</p>}
        {d.reviews.map((item) => {
          const revision = d.revisions.find(
            (r) => r.id === item.current_revision_id,
          );
          return (
            <article
              className="automation-record"
              key={`${item.id}-${item.version}`}
              data-review-id={item.id}
            >
              <h3>
                {categories[item.category]} · {states[item.status]}
              </h3>
              <p>
                {date(item.retrieved_at)} · {item.language.toUpperCase()}
              </p>
              <a
                href={item.source_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {item.source_url}
              </a>
              <blockquote>{item.excerpt}</blockquote>
              <details>
                <summary>SHA-256</summary>
                <code>
                  {item.previous_fingerprint ?? "—"} → {item.fingerprint ?? "—"}
                </code>
              </details>
              {item.verification_notes && (
                <p>
                  {m.verification}: {item.verification_notes}
                </p>
              )}
              {revision && (
                <div className="automation-notice">
                  <h4>
                    {revision.title} · {m.revision} {revision.revision}
                  </h4>
                  <p className="automation-text">{revision.body}</p>
                  <p>{m.attribution}</p>
                  <p>
                    {m.licensing}: {revision.licensing_notes}
                  </p>
                </div>
              )}
              <ReviewForms
                locale={locale}
                item={item}
                revision={revision}
                admin={d.is_admin}
              />
            </article>
          );
        })}
      </section>
      <section id="drafts" className="automation-panel">
        <h2>{m.drafts}</h2>
        <p>{m.approvalNote}</p>
        {d.reviews.filter((r) => r.status === "draft").length === 0 ? (
          <p>{m.empty}</p>
        ) : (
          d.reviews
            .filter((r) => r.status === "draft")
            .map((r) => (
              <p key={r.id}>
                <a href="#queue">
                  {d.revisions.find((v) => v.id === r.current_revision_id)
                    ?.title ?? r.id}
                </a>
              </p>
            ))
        )}
      </section>
      <section id="report" className="automation-panel">
        <h2>{m.report}</h2>
        <p>{m.reportNote}</p>
        <p>{date(d.report.generated_at)}</p>
        <dl className="automation-grid">
          {[
            [m.verified, d.report.verified_changes],
            [m.pending, d.report.drafts_awaiting_review],
            [m.failures, d.report.failures],
            [m.stale, d.report.stale_sources],
            [m.fresh, d.report.fresh_sources],
            [m.owner, d.report.owner_approval],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className="automation-number">{value}</dd>
            </div>
          ))}
        </dl>
        <h3>{m.alerts}</h3>
        {d.reviews
          .filter((r) => importantAlert(r))
          .map((r) => (
            <p key={r.id}>
              {categories[r.category]} · {states[r.status]}
            </p>
          ))}
        {!d.reviews.some((r) => importantAlert(r)) && <p>{m.empty}</p>}
      </section>
      <section id="history" className="automation-panel">
        <h2>{m.history}</h2>
        {!d.history.length && <p>{m.empty}</p>}
        <ol>
          {d.history.map((h) => (
            <li key={h.id}>
              {date(h.created_at)} · {h.action}: {h.previous_status ?? "—"} →{" "}
              {h.next_status ?? "—"}
              {h.notes && <p>{h.notes}</p>}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
