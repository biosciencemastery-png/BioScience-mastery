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
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = authMessages(locale),
    input = confirmationSchema.safeParse(await searchParams);
  return (
    <main id="main" className="auth-section">
      <div className="auth-card">
        <h1>{m.confirm}</h1>
        {!authConfig() ? (
          <p className="auth-message">{m.setup}</p>
        ) : !input.success ? (
          <p className="auth-message error" role="alert">
            {m.errors.link}
          </p>
        ) : (
          <>
            <p>{m.confirmHelp}</p>
            <AuthForm
              kind="confirm"
              locale={locale}
              token={input.data.token_hash}
              type={input.data.type}
            />
          </>
        )}
        <Link className="text-link" href={`/${locale}/login`}>
          {m.loginLink}
        </Link>
      </div>
    </main>
  );
}
