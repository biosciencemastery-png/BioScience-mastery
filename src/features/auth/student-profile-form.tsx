"use client";
import { useActionState } from "react";
import type { Locale } from "@/lib/i18n";
import type { ExamRecord } from "@/features/exams/catalogue";
import { initialAuthState } from "@/lib/auth/validation";
import { authMessages } from "@/lib/auth/messages";
import { AcademicFields, GoalFields, studentLabels } from "./student-fields";
import { saveStudentProfileAction } from "./actions";
export function StudentProfileForm({
  locale,
  exams,
  details,
  selected,
  year,
  marketing,
}: {
  locale: Locale;
  exams: ExamRecord[] | null;
  details: Record<string, string>;
  selected: string[];
  year: string;
  marketing: boolean;
}) {
  const [state, action, pending] = useActionState(
      saveStudentProfileAction,
      initialAuthState,
    ),
    m = studentLabels[locale],
    a = authMessages(locale);
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="auth-form"
    >
      <h2>{m.academic}</h2>
      <input type="hidden" name="locale" value={locale} />
      <label>
        {m.phone}
        <input
          type="tel"
          name="phone"
          maxLength={20}
          defaultValue={details.phone ?? ""}
        />
      </label>
      <AcademicFields locale={locale} details={details} />
      <GoalFields
        locale={locale}
        exams={exams}
        selected={selected}
        year={year}
        marketing={marketing}
      />
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`auth-message ${state.status}`}
        >
          {state.status === "success"
            ? m.saved
            : a.errors[state.message as keyof typeof a.errors]}
        </p>
      )}
      <button className="button" disabled={pending || exams === null}>
        {pending ? a.pending : m.save}
      </button>
    </form>
  );
}
