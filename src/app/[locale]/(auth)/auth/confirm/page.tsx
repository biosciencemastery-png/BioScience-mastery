
import Link from "next/link";
import { notFound } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authMessages } from "@/lib/auth/messages";
import { confirmationSchema } from "@/lib/auth/validation";
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

  const isPkce = typeof query.code === "string";
  const validCode =
    isPkce &&
    /^[A-Za-z0-9_-]{8,2048}$/.test(query.code ?? "");

  const input = confirmationSchema.safeParse(query);

  return (
    <main id="main" className="auth-section">
      <div className="auth-card">
        <h1>{m.confirm}</h1>

        {!config ? (
          <p className="auth-message">{m.setup}</p>
        ) : validCode ? (
          <>
            <p>{m.confirmHelp}</p>
            <AuthForm
              kind="pkce"
              locale={locale}
              code={query.code}
              flow={
                query.flow === "recovery"
                  ? "recovery"
                  : "signup"
              }
            />
          </>
        ) : !isPkce && input.success ? (
          <>
            <p>{m.confirmHelp}</p>
            <AuthForm
              kind="confirm"
              locale={locale}
              token={input.data.token_hash}
              type={input.data.type}
            />
          </>
        ) : (
          <p
            className="auth-message error"
            role="alert"
          >
            {m.errors.link}
          </p>
        )}

        <Link
          className="text-link"
          href={`/${locale}/login`}
        >
          {m.loginLink}
        </Link>
      </div>
    </main>
  );
}
