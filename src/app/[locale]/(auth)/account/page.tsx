import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { isLocale } from "@/lib/i18n";
import { authMessages } from "@/lib/auth/messages";
import { AuthForm } from "@/features/auth/auth-form";
import { logoutAction } from "@/features/auth/actions";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, user } = await requireUser(locale);
  const m = authMessages(locale);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name,preferred_language")
    .eq("id", user.id)
    .single();
  return (
    <main id="main" className="auth-section">
      <div className="auth-card account-card">
        <p className="eyebrow">BIOSCIENCE MASTERY</p>
        <h1>{m.account}</h1>
        {(await searchParams).notice === "failed" && (
          <p role="alert" className="auth-message error">
            {m.errors.failed}
          </p>
        )}
        <p>{m.accountIntro}</p>
        <p className="auth-help">{user.email}</p>
        {error || !profile ? (
          <p role="alert">{m.profileUnavailable}</p>
        ) : (
          <AuthForm
            kind="profile"
            locale={locale}
            profile={{
              display_name: profile.display_name,
              preferred_language: profile.preferred_language,
            }}
          />
        )}
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button className="button">{m.signOut}</button>
        </form>
        <section className="deletion-section">
          <h2>{m.requestDeletion}</h2>
          <p>{m.deletionHelp}</p>
          <AuthForm kind="deletion" locale={locale} />
        </section>
      </div>
    </main>
  );
}
