import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  FileQuestion,
  Files,
  Timer,
  ChartNoAxesCombined,
  ShieldCheck,
  ArrowRight,
  Check,
  Globe2,
} from "lucide-react";
import { ScienceArt } from "@/components/ui/science-art";
import { examCatalogue } from "@/features/exams/catalogue";
import { getMessages, isLocale } from "@/lib/i18n";
import { homeMessages } from "@/features/home/messages";
import { ExamStrip } from "@/features/home/exam-strip";
import "./home.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    description: homeMessages[locale].description,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", hi: "/hi" },
    },
    openGraph: {
      title: "BioScience Mastery",
      description: homeMessages[locale].description,
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      type: "website",
    },
  };
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = homeMessages[locale],
    exams = await examCatalogue();
  const icons = [
    BookOpen,
    FileQuestion,
    Files,
    Timer,
    ChartNoAxesCombined,
    ShieldCheck,
  ];
  return (
    <main id="main" tabIndex={-1} className="public-home">
      <section className="home-hero container">
        <div className="home-hero-copy">
          <p className="home-eyebrow">
            <span /> {m.eyebrow}
          </p>
          <h1>
            {m.title.map((line, i) => (
              <span key={line} className={i === 1 ? "home-accent" : ""}>
                {line}
              </span>
            ))}
          </h1>
          <p className="home-lead">{m.description}</p>
          <div className="home-actions">
            <Link className="button" href={`/${locale}/register`}>
              {m.start}
              <ArrowUpRight size={18} aria-hidden />
            </Link>
            <Link className="home-secondary" href={`/${locale}/exams`}>
              {m.explore}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
          <p className="home-note">
            <Globe2 size={17} aria-hidden />
            {m.note}
          </p>
        </div>
        <div className="home-science-panel">
          <p className="home-eyebrow">{m.visual}</p>
          <ScienceArt />
          <div>
            <h2>{m.visualTitle}</h2>
            <p>{m.visualNote}</p>
          </div>
        </div>
      </section>
      <section
        className="home-exams"
        id="courses"
        aria-labelledby="exam-heading"
      >
        <div className="container home-exam-heading" id="coming-soon">
          <div>
            <h2 id="exam-heading">{m.exams}</h2>
            <p>{m.examNote}</p>
          </div>
          <Link href={`/${locale}/exams`}>
            {m.explore} <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
        <ExamStrip
          exams={(exams ?? []).map((e) => ({
            id: e.id,
            name: locale === "hi" ? e.name_hi || e.name : e.name,
            href:
              e.slug === "gat-b" &&
              e.courses.some(
                (c) => c.slug === "gat-b" && c.launch_status !== "archived",
              )
                ? `/${locale}/courses/gat-b`
                : `/${locale}/exams`,
          }))}
          pause={m.pause}
          play={m.play}
        />
      </section>
      <section id="approach" className="home-section container">
        <div className="home-section-heading">
          <p className="home-eyebrow">{m.about}</p>
          <h2>{m.featuresTitle}</h2>
          <p>{m.aboutText}</p>
        </div>
        <div className="home-features">
          {m.features.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article key={title}>
                <span className="home-feature-icon">
                  <Icon size={23} aria-hidden />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            );
          })}
        </div>
        <p className="home-availability">{m.availability}</p>
      </section>
      <section className="home-how">
        <div className="container home-section">
          <div className="home-section-heading">
            <p className="home-eyebrow">{m.how}</p>
            <h2>{m.howTitle}</h2>
          </div>
          <ol>
            {m.steps.map(([title, text], i) => (
              <li key={title}>
                <span className="home-step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="home-preview home-section container" id="resources">
        <div>
          <p className="home-eyebrow">{m.preview}</p>
          <h2>{m.previewTitle}</h2>
          <p className="home-lead">{m.previewText}</p>
          <Link className="home-secondary" href={`/${locale}/register`}>
            {m.start}
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <figure className="home-workspace">
          <figcaption>
            <span>{m.previewLabel}</span>
            <span className="home-preview-badge">{m.previewBadge}</span>
          </figcaption>
          <div className="home-workspace-body">
            <h3>{m.workspace}</h3>
            <p>{m.workspaceNote}</p>
            <ul>
              {m.tabs.map((tab) => (
                <li key={tab}>
                  <Check size={17} aria-hidden />
                  {tab}
                  <span aria-hidden>↗</span>
                </li>
              ))}
            </ul>
            <p className="home-workspace-note">{m.noStats}</p>
          </div>
        </figure>
      </section>
      <section id="faq" className="container home-faq">
        <h2>{getMessages(locale).faq.title}</h2>
        <div className="faq-list">
          {getMessages(locale)
            .faq.items.filter((_, index) => index === 2 || index === 5)
            .map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
        </div>
      </section>
      <section className="home-final container">
        <div>
          <p className="home-eyebrow">BioScience Mastery</p>
          <h2>{m.closing}</h2>
          <p>{m.closingText}</p>
        </div>
        <Link className="button" href={`/${locale}/register`}>
          {m.free}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
      </section>
    </main>
  );
}
