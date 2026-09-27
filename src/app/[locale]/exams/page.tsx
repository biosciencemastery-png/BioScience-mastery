import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { examCatalogue } from "@/features/exams/catalogue";
import { ExamCards } from "@/features/exams/cards";
import { examMessages } from "@/features/exams/messages";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = examMessages(locale);
  return (
    <main id="main" className="section exam-page">
      <div className="container">
        <p className="eyebrow">BIOSCIENCE MASTERY</p>
        <h1>{m.title}</h1>
        <p className="exam-intro">{m.intro}</p>
        <ExamCards exams={await examCatalogue()} locale={locale} />
      </div>
    </main>
  );
}
