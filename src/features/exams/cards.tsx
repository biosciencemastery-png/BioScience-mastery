import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { ExamRecord } from "./catalogue";
import { examMessages } from "./messages";
export function ExamCards({
  exams,
  locale,
}: {
  exams: ExamRecord[] | null;
  locale: Locale;
}) {
  const m = examMessages(locale);
  if (!exams)
    return (
      <p className="auth-message" role="status">
        {m.unavailable}
      </p>
    );
  if (!exams.length) return <p>{m.empty}</p>;
  return (
    <div className="exam-grid">
      {exams.map((exam) => {
        const course = exam.courses.find(
          (c) => c.slug === exam.slug && c.launch_status !== "archived",
        );
        const status = course?.launch_status ?? "coming_soon";
        return (
          <article className="exam-card" key={exam.id}>
            <p className="eyebrow">
              {status === "published"
                ? m.published
                : status === "in_preparation"
                  ? m.preparing
                  : m.coming}
            </p>
            <h2>{locale === "hi" ? exam.name_hi || exam.name : exam.name}</h2>
            {status !== "published" && <p>{m.noLessons}</p>}
            {exam.slug === "gat-b" && course ? (
              <Link className="button" href={`/${locale}/courses/gat-b`}>
                {m.explore}
              </Link>
            ) : course ? (
              <Link
                className="button"
                href={`/${locale}/exams/${exam.slug}/notify`}
              >
                {m.notify}
              </Link>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
