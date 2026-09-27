"use client";
import { useActionState } from "react";
import { authMessages } from "@/lib/auth/messages";
import { initialAuthState } from "@/lib/auth/validation";
import type { Locale } from "@/lib/i18n";
import {
  loginAction,
  registerAction,
  forgotAction,
  resetAction,
  confirmAction,
  profileAction,
  deletionAction,
} from "./actions";

const actions = {
  login: loginAction,
  register: registerAction,
  forgot: forgotAction,
  reset: resetAction,
  confirm: confirmAction,
  profile: profileAction,
  deletion: deletionAction,
};
export type FormKind = keyof typeof actions;
export function AuthForm({
  kind,
  locale,
  token,
  type,
  profile,
}: {
  kind: FormKind;
  locale: Locale;
  token?: string;
  type?: string;
  profile?: { display_name: string; preferred_language: string };
}) {
  const [state, action, pending] = useActionState(
    actions[kind],
    initialAuthState,
  );
  const m = authMessages(locale);
  const label = {
    login: m.signIn,
    register: m.signUp,
    forgot: m.sendReset,
    reset: m.updatePassword,
    confirm: m.confirmButton,
    profile: m.save,
    deletion: m.requestDeletion,
  }[kind];
  const showPassword = ["login", "register", "reset", "deletion"].includes(
    kind,
  );
  const isNewPassword = kind === "register" || kind === "reset";
  const message =
    state.status === "error"
      ? m.errors[state.message as keyof typeof m.errors]
      : m.success[state.message as keyof typeof m.success];
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="locale" value={locale} />
      {kind === "confirm" && (
        <>
          <input type="hidden" name="token_hash" value={token} />
          <input type="hidden" name="type" value={type} />
        </>
      )}
      {(kind === "register" || kind === "profile") && (
        <label>
          {m.displayName}
          <input
            name="display_name"
            autoComplete="nickname"
            required
            minLength={1}
            maxLength={80}
            defaultValue={profile?.display_name}
          />
        </label>
      )}
      {["login", "register", "forgot"].includes(kind) && (
        <label>
          {m.email}
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
      )}
      {showPassword && (
        <label>
          {kind === "deletion"
            ? m.currentPassword
            : isNewPassword
              ? m.newPassword
              : m.password}
          <input
            name="password"
            type="password"
            autoComplete={isNewPassword ? "new-password" : "current-password"}
            required
            minLength={isNewPassword ? 12 : 1}
            maxLength={128}
            aria-describedby={
              isNewPassword ? `${kind}-password-help` : undefined
            }
          />
          {isNewPassword && (
            <span id={`${kind}-password-help`} className="auth-help">
              {m.passwordHelp}
            </span>
          )}
        </label>
      )}
      {kind === "profile" && (
        <label>
          {m.language}
          <select
            name="preferred_language"
            defaultValue={profile?.preferred_language ?? locale}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </label>
      )}
      {kind === "deletion" && (
        <label className="auth-checkbox">
          <input type="checkbox" name="acknowledge" required />
          {m.deletionConsent}
        </label>
      )}
      {message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`auth-message ${state.status}`}
        >
          {message}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? m.pending : label}
      </button>
    </form>
  );
}
