"use client";
import { Challenge } from "./challenge";
import { useActionState } from "react";
import type { Locale } from "@/lib/i18n";
import { examMessages } from "@/features/exams/messages";
import {
  subscribeAction,
  notificationLinkAction,
  type NotificationState,
} from "./actions";
const initial: NotificationState = { status: "idle", message: "" };
export function NotificationForm({
  locale,
  courseId,
  siteKey,
  token,
  kind,
}: {
  locale: Locale;
  courseId?: string;
  siteKey?: string;
  token?: string;
  kind?: "confirm" | "unsubscribe";
}) {
  const [state, action, pending] = useActionState(
    kind ? notificationLinkAction : subscribeAction,
    initial,
  );
  const m = examMessages(locale);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="locale" value={locale} />
      {kind ? (
        <>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="kind" value={kind} />
        </>
      ) : (
        <>
          <input type="hidden" name="course_id" value={courseId} />
          <label>
            {m.email}
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <input
            name="website"
            className="notification-trap"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            defaultValue=""
          />
          <label className="auth-checkbox">
            <input name="consent" type="checkbox" required />
            {m.consent}
          </label>
          {siteKey && (
            <Challenge siteKey={siteKey} locale={locale} revision={state} />
          )}
        </>
      )}
      {state.message && (
        <p
          className={`auth-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {m[state.message]}
        </p>
      )}
      {state.status !== "success" && (
        <button className="button" disabled={pending}>
          {pending ? m.pending : kind ? m[kind] : m.submit}
        </button>
      )}
    </form>
  );
}
