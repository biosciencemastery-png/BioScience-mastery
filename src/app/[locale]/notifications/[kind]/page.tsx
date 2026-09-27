import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { examMessages } from "@/features/exams/messages";
import { notificationConfig } from "@/features/notifications/server";
import { NotificationForm } from "@/features/notifications/form";
export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; kind: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale, kind } = await params;
  if (!isLocale(locale) || (kind !== "confirm" && kind !== "unsubscribe"))
    notFound();
  const { token } = await searchParams,
    m = examMessages(locale);
  return (
    <main id="main" className="auth-section">
      <div className="auth-card">
        <h1>{m[kind]}</h1>
        {!notificationConfig() ? (
          <p>{m.disabled}</p>
        ) : typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token) ? (
          <NotificationForm locale={locale} kind={kind} token={token} />
        ) : (
          <p role="alert">{m.badLink}</p>
        )}
        <Link href={`/${locale}/exams`}>{m.back}</Link>
      </div>
    </main>
  );
}
