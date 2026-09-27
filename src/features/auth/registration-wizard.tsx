"use client";
import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { ExamRecord } from "@/features/exams/catalogue";
import { authMessages } from "@/lib/auth/messages";
import { initialAuthState, type AuthState } from "@/lib/auth/validation";
import { registerAction } from "./actions";
import { AcademicFields, GoalFields, studentLabels } from "./student-fields";
import {
  academicSchema,
  studentInput,
  wizardSchema,
} from "./student-validation";
export function RegistrationWizard({
  locale,
  exams,
  policies,
}: {
  locale: Locale;
  exams: ExamRecord[] | null;
  policies: { terms: string; privacy: string } | null;
}) {
  const [step, setStep] = useState(0),
    [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const [state, action, pending] = useActionState(
    async (previous: AuthState, data: FormData) => {
      const result = await registerAction(previous, data);
      if (result.status === "success")
        form.current
          ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
          .forEach((input) => {
            input.value = "";
          });
      return result;
    },
    initialAuthState,
  );
  const m = studentLabels[locale],
    a = authMessages(locale),
    titles = [m.personal, m.academic, m.goals];
  function move(next: number) {
    setError("");
    form.current?.querySelectorAll("[aria-invalid]").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function advance() {
    const node = form.current!;
    for (const input of node.querySelectorAll<
      HTMLInputElement | HTMLSelectElement
    >(`[data-step="${step}"] input,[data-step="${step}"] select`))
      if (!input.reportValidity()) {
        setError(m.invalid);
        return;
      }
    const data = new FormData(node);
    if (
      step === 0 &&
      !academicSchema.safeParse({ phone: data.get("phone") }).success
    ) {
      showError("phone", m.invalid);
      return;
    }
    if (step === 0 && data.get("password") !== data.get("confirm_password")) {
      showError("confirm_password", m.mismatch);
      return;
    }
    if (
      step === 1 &&
      !academicSchema.safeParse(studentInput(data).details).success
    ) {
      showError("gender_description", m.invalid);
      return;
    }
    move(Math.min(2, step + 1));
  }
  function showError(name: string, message: string) {
    setError(message);
    const input = form.current?.querySelector<HTMLInputElement>(
      `[name="${name}"]`,
    );
    input?.setAttribute("aria-invalid", "true");
    input?.setAttribute("aria-describedby", "wizard-error");
    input?.focus();
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    if (step < 2) {
      event.preventDefault();
      advance();
      return;
    }
    const data = new FormData(event.currentTarget);
    const input = wizardSchema.safeParse({
      ...Object.fromEntries(data),
      ...studentInput(data),
    });
    if (!policies || !exams || !input.success) {
      event.preventDefault();
      setError(m.invalid);
      if (!input.success) {
        const name = String(input.error.issues[0].path.at(-1));
        const target = [
          "display_name",
          "email",
          "password",
          "confirm_password",
          "phone",
        ].includes(name)
          ? 0
          : [
                "gender",
                "gender_description",
                "qualification",
                "specialization",
                "academic_status",
                "academic_year",
              ].includes(name)
            ? 1
            : 2;
        setStep(target);
        requestAnimationFrame(() => showError(name, m.invalid));
      }
    }
  }
  const message =
    state.status === "error"
      ? a.errors[state.message as keyof typeof a.errors]
      : a.success[state.message as keyof typeof a.success];
  return (
    <>
      <ol
        className="wizard-steps"
        aria-label={locale === "hi" ? "पंजीकरण चरण" : "Registration steps"}
      >
        {titles.map((t, i) => (
          <li key={t} aria-current={step === i ? "step" : undefined}>
            {i + 1}. {t}
          </li>
        ))}
      </ol>
      {!policies && (
        <p className="auth-message" role="status">
          {m.closed}
        </p>
      )}
      <h2 ref={heading} tabIndex={-1}>
        {titles[step]}
      </h2>
      <form
        ref={form}
        action={action}
        onSubmit={submit}
        onReset={(event) => event.preventDefault()}
        noValidate
        className="auth-form"
      >
        <input type="hidden" name="locale" value={locale} />
        <input
          type="hidden"
          name="terms_version"
          value={policies?.terms ?? ""}
        />
        <input
          type="hidden"
          name="privacy_version"
          value={policies?.privacy ?? ""}
        />
        <fieldset data-step="0" hidden={step !== 0}>
          <legend className="sr-only">{m.personal}</legend>
          <label>
            {m.name}
            <input
              name="display_name"
              autoComplete="name"
              required
              maxLength={80}
            />
          </label>
          <label>
            {a.email}
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            {a.newPassword}
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              aria-describedby="wizard-password-help"
            />
          </label>
          <p id="wizard-password-help" className="auth-help">
            {a.passwordHelp}
          </p>
          <label>
            {m.confirm}
            <input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <label>
            {m.phone}
            <input type="tel" name="phone" autoComplete="tel" maxLength={20} />
          </label>
        </fieldset>
        <fieldset data-step="1" hidden={step !== 1}>
          <legend className="sr-only">{m.academic}</legend>
          <AcademicFields locale={locale} />
        </fieldset>
        <fieldset data-step="2" hidden={step !== 2}>
          <legend className="sr-only">{m.goals}</legend>
          <GoalFields locale={locale} exams={exams} />
          <label className="auth-checkbox">
            <input type="checkbox" name="terms" required />
            <span>
              {m.terms}{" "}
              <Link href={`/${locale}/terms`} target="_blank" rel="noopener">
                {locale === "hi"
                  ? "नियम पढ़ें (नया टैब)"
                  : "Read Terms (new tab)"}
              </Link>
            </span>
          </label>
          <label className="auth-checkbox">
            <input type="checkbox" name="privacy" required />
            <span>
              {m.privacy}{" "}
              <Link href={`/${locale}/privacy`} target="_blank" rel="noopener">
                {locale === "hi"
                  ? "नीति पढ़ें (नया टैब)"
                  : "Read Privacy Policy (new tab)"}
              </Link>
            </span>
          </label>
          <Link
            href={`/${locale}/refund-policy`}
            target="_blank"
            rel="noopener"
          >
            {locale === "hi"
              ? "धनवापसी मसौदा (नया टैब)"
              : "Refund policy draft (new tab)"}
          </Link>
        </fieldset>
        {error && (
          <p id="wizard-error" role="alert" className="auth-message error">
            {error}
          </p>
        )}
        {message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`auth-message ${state.status}`}
          >
            {message}
          </p>
        )}
        <div className="wizard-controls">
          {step > 0 && (
            <button
              type="button"
              className="button"
              onClick={() => move(step - 1)}
              disabled={pending}
            >
              {m.back}
            </button>
          )}
          {step < 2 ? (
            <button type="button" className="button" onClick={advance}>
              {m.next}
            </button>
          ) : (
            <button
              type="submit"
              className="button"
              disabled={
                pending || !policies || !exams || state.status === "success"
              }
            >
              {pending ? a.pending : m.submit}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
