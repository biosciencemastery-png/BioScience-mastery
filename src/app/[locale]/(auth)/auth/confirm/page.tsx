import Link from "next/link";
import { notFound } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authMessages } from "@/lib/auth/messages";
import { parseEmailCallback } from "@/lib/auth/email-callback";
import { isLocale } from "@/lib/i18n";
import { AuthForm } from "@/features/auth/auth-form";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    flow?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = authMessages(locale);
  const query = await searchParams;
  const config = authConfig();

  const input = parseEmailCallback(query);

  return (
    <main id="main" className="auth-section">
      <div className="auth-card">
        <h1>{m.confirm}</h1>

        {!config ? (
          <p className="auth-message">{m.setup}</p>
        ) : input?.kind === "pkce" ? (
          <>
            <p>{m.confirmHelp}</p>
            <AuthForm kind="pkce" locale={locale} code={input.code} />
          </>
        ) : input?.kind === "token" ? (
          <>
            <p>{m.confirmHelp}</p>
            <AuthForm
              kind="confirm"
              locale={locale}
              token={input.token_hash}
              type={input.type}
            />
          </>
        ) : (
          <p className="auth-message error" role="alert">
            {m.errors.link}
          </p>
        )}

        <Link className="text-link" href={`/${locale}/login`}>
          {m.loginLink}
        </Link>
      </div>
    </main>
  );
}
