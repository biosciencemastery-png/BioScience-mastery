import { RegistrationWizard } from "./registration-wizard";
import { registrationPolicies } from "@/features/legal/server";
import { examCatalogue } from "@/features/exams/catalogue";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authMessages } from "@/lib/auth/messages";
import { isLocale } from "@/lib/i18n";
import { AuthForm, type FormKind } from "./auth-form";
export async function AuthPage({
  params,
  kind,
  notice,
}: {
  params: Promise<{ locale: string }>;
  kind: Extract<FormKind, "login" | "register" | "forgot" | "reset">;
  notice?: string;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = authMessages(locale),
    configured = !!authConfig();
  return (
    <main id="main" className="auth-section">
      <div
        className={`auth-card ${kind === "register" ? "registration-card" : ""}`}
      >
        <p className="eyebrow">BIOSCIENCE MASTERY</p>
        <h1>{m[kind]}</h1>
        {notice === "passwordUpdated" && (
          <p className="auth-message success" role="status">
            {m.success.passwordUpdated}
          </p>
        )}
        {kind === "register" ? (
          <RegistrationWizard
            locale={locale}
            exams={await examCatalogue()}
            policies={await registrationPolicies(locale)}
          />
        ) : configured ? (
          <AuthForm kind={kind} locale={locale} />
        ) : (
          <p className="auth-message" role="status">
            {m.setup}
          </p>
        )}
        <nav
          className="auth-links"
          aria-label={locale === "hi" ? "खाते के विकल्प" : "Account options"}
        >
          {kind === "login" ? (
            <>
              <Link href={`/${locale}/forgot-password`}>{m.forgotLink}</Link>
              <Link href={`/${locale}/register`}>{m.registerLink}</Link>
            </>
          ) : (
            <Link href={`/${locale}/login`}>{m.loginLink}</Link>
          )}
          <Link href={`/${locale}`}>{m.home}</Link>
        </nav>
      </div>
    </main>
  );
}
