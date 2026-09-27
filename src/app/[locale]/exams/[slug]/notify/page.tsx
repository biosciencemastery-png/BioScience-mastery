import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { examCatalogue } from "@/features/exams/catalogue";
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
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const m = examMessages(locale),
    exams = await examCatalogue();
  const exam = exams?.find((e) => e.slug === slug),
    course = exam?.courses.find((c) => c.slug === slug);
  if (
    exams &&
    (!course ||
      !["coming_soon", "in_preparation"].includes(course.launch_status))
  )
    notFound();
  const config = notificationConfig();
  return (
    <main id="main" className="auth-section">
      <div className="auth-card">
        <h1>{m.notifyTitle}</h1>
        <p>{locale === "hi" ? (exam?.name_hi ?? exam?.name) : exam?.name}</p>
        {!exams ? (
          <p role="status">{m.unavailable}</p>
        ) : config &&
          process.env.EMAIL_DELIVERY_ENABLED === "true" &&
          course ? (
          <NotificationForm
            locale={locale}
            courseId={course.id}
            siteKey={config.siteKey}
          />
        ) : (
          <p role="status">{m.disabled}</p>
        )}
        <Link href={`/${locale}/exams`}>{m.back}</Link>
      </div>
    </main>
  );
}
