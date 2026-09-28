"use client";
import { useActionState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { automationAction, type AutomationState } from "./actions";
import type { Dashboard, Review, Revision, Source } from "./model";
import { automationMessages } from "./messages";

function Form({
  locale,
  command,
  children,
  hidden = {},
  label,
}: {
  locale: Locale;
  command: string;
  children: ReactNode;
  hidden?: Record<string, string | number>;
  label?: string;
}) {
  const [state, action, pending] = useActionState(automationAction, {
    status: "idle",
    message: "",
  } as AutomationState);
  const m = automationMessages[locale];
  return (
    <form
      action={action}
      className="auth-form"
      onReset={(e) => e.preventDefault()}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="command" value={command} />
      {Object.entries(hidden).map(([name, value]) => (
        <input type="hidden" key={name} name={name} value={value} />
      ))}
      {children}
      <p
        role="status"
        className={`auth-message ${state.status === "error" ? "error" : ""}`}
      >
        {state.message ? m[state.message] : ""}
      </p>
      <button className="button" disabled={pending} type="submit">
        {label ?? m.save}
        {pending ? "…" : ""}
      </button>
    </form>
  );
}
function Field({
  label,
  name,
  value = "",
  min = 1,
  max = 200,
  area = false,
}: {
  label: string;
  name: string;
  value?: string;
  min?: number;
  max?: number;
  area?: boolean;
}) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          name={name}
          defaultValue={value}
          minLength={min}
          maxLength={max}
          rows={4}
          required
        />
      ) : (
        <input
          name={name}
          defaultValue={value}
          minLength={min}
          maxLength={max}
          required
        />
      )}
    </label>
  );
}
function Select({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: Record<string, string>;
  value?: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value}>
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function SourceForm({
  locale,
  exams,
  source,
}: {
  locale: Locale;
  exams: Dashboard["examinations"];
  source?: Source;
}) {
  const m = automationMessages[locale];
  return (
    <Form
      locale={locale}
      command="source"
      hidden={source ? { id: source.id, version: source.version } : {}}
    >
      <Select
        label={m.exam}
        name="examination_id"
        value={source?.examination_id}
        options={Object.fromEntries(
          exams.map((e) => [e.id, locale === "hi" ? e.name_hi : e.name]),
        )}
      />
      <Field
        label={m.name}
        name="name"
        value={source?.name}
        min={2}
        max={160}
      />
      <Field label={m.url} name="url" value={source?.url} max={2048} />
      <Select
        label={m.type}
        name="source_type"
        value={source?.source_type}
        options={m.sourceTypes}
      />
      <Select
        label={m.verification}
        name="verification_status"
        value={source?.verification_status}
        options={{
          needs_review: m.states.needs_review,
          verified: m.states.verified,
        }}
      />
      <Field
        label={m.notes}
        name="verification_notes"
        value={source?.verification_notes}
        min={10}
        max={2000}
        area
      />
      <Field
        label={m.licensing}
        name="licensing_notes"
        value={source?.licensing_notes}
        min={2}
        max={2000}
        area
      />
      <label className="auth-checkbox">
        <input
          name="active"
          type="checkbox"
          defaultChecked={source?.active ?? false}
        />
        {m.active}
      </label>
    </Form>
  );
}
export function CollectionForm({
  locale,
  sources,
  requestId,
}: {
  locale: Locale;
  sources: Source[];
  requestId: string;
}) {
  const m = automationMessages[locale];
  return (
    <Form
      locale={locale}
      command="collect"
      hidden={{ idempotency_key: requestId }}
    >
      <Select
        label={m.name}
        name="source_id"
        options={Object.fromEntries(
          sources
            .filter((s) => s.active && s.verification_status === "verified")
            .map((s) => [s.id, s.name]),
        )}
      />
      <Select
        label={m.language}
        name="language"
        options={{ en: "English", hi: "हिन्दी" }}
        value={locale}
      />
      <Select
        label={m.outcome}
        name="outcome"
        options={{ complete: m.success, failure: m.failure }}
      />
      <Field label={m.excerpt} name="text" max={12000} area />
    </Form>
  );
}
export function ReviewForms({
  locale,
  item,
  revision,
  admin,
}: {
  locale: Locale;
  item: Review;
  revision?: Revision;
  admin: boolean;
}) {
  const m = automationMessages[locale],
    hidden = { id: item.id, version: item.version };
  return (
    <>
      {["detected", "needs_review", "verified", "rejected"].includes(
        item.status,
      ) && (
        <details>
          <summary>{m.triage}</summary>
          <Form locale={locale} command="triage" hidden={hidden}>
            <Select
              label={m.verification}
              name="status"
              options={{
                needs_review: m.states.needs_review,
                ...(item.change_type === "retrieval_failure"
                  ? {}
                  : { verified: m.states.verified }),
              }}
            />
            <Select
              label={m.category}
              name="category"
              value={item.category}
              options={m.categories}
            />
            <Field
              label={m.notes}
              name="notes"
              value={item.verification_notes}
              min={10}
              max={2000}
              area
            />
          </Form>
        </details>
      )}
      {["verified", "draft", "approved"].includes(item.status) && (
        <details>
          <summary>{m.draft}</summary>
          <Form locale={locale} command="draft" hidden={hidden}>
            <Field
              label={m.titleField}
              name="title"
              value={revision?.title}
              min={2}
            />
            <Field
              label={m.body}
              name="body"
              value={revision?.body}
              min={10}
              max={12000}
              area
            />
            <Select
              label={m.language}
              name="language"
              options={{ en: "English", hi: "हिन्दी" }}
              value={revision?.language ?? item.language}
            />
            <Field
              label={m.licensing}
              name="licensing_notes"
              value={revision?.licensing_notes ?? item.licensing_notes}
              min={2}
              max={2000}
              area
            />
            <label className="auth-checkbox">
              <input name="rights_confirmed" type="checkbox" required />
              {m.rights}
            </label>
            <p>{m.attribution}</p>
          </Form>
        </details>
      )}
      {admin && item.status === "draft" && (
        <details>
          <summary>{m.approve}</summary>
          <Form
            locale={locale}
            command="approve"
            hidden={hidden}
            label={m.approve}
          >
            <Field label={m.reason} name="notes" min={10} max={2000} area />
            <p>{m.approvalNote}</p>
          </Form>
        </details>
      )}
      {admin && !["published", "rejected"].includes(item.status) && (
        <details>
          <summary>{m.reject}</summary>
          <Form
            locale={locale}
            command="reject"
            hidden={hidden}
            label={m.reject}
          >
            <Field label={m.reason} name="notes" min={10} max={2000} area />
          </Form>
        </details>
      )}
    </>
  );
}
