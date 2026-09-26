import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { ScienceArt } from "@/components/ui/science-art";
import { getMessages, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return [{ slug: "gat-b" }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || slug !== "gat-b") return {};
  return {
    title: "GAT-B",
    description: getMessages(locale).course.description,
    alternates: {
      canonical: `/${locale}/courses/gat-b`,
      languages: { en: "/en/courses/gat-b", hi: "/hi/courses/gat-b" },
    },
    openGraph: {
      title: "GAT-B | Bioscience Mastery",
      description: getMessages(locale).course.description,
      type: "website",
    },
  };
}
export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || slug !== "gat-b") notFound();
  const m = getMessages(locale),
    c = m.course;
  return (
    <main id="main">
      <section className="course-hero">
        <div className="container">
          <Link className="breadcrumb" href={`/${locale}#courses`}>
            <ArrowLeft size={15} aria-hidden="true" />
            {c.breadcrumb}
          </Link>
          <div className="course-hero-grid">
            <div>
              <p className="eyebrow">{c.eyebrow}</p>
              <h1>{c.title}</h1>
              <p className="course-subtitle" lang="en">
                {c.subtitle}
              </p>
              <p className="hero-description">{c.description}</p>
              <div className="hero-actions">
                <a href="#experience" className="button button-mint">
                  {c.primary}
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
              <div className="hero-notes">
                <span>
                  <Globe2 size={16} aria-hidden="true" />
                  {c.languageValue}
                </span>
                <span>
                  <Check size={16} aria-hidden="true" />
                  {c.status}
                </span>
              </div>
            </div>
            <div className="course-hero-art">
              <ScienceArt />
              <span className="course-art-caption">
                GAT-B <span>BIOSCIENCE MASTERY</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container course-body-grid">
          <div>
            <div className="course-overview">
              <p className="eyebrow">BIOSCIENCE MASTERY / GAT-B</p>
              <h2>{c.overview}</h2>
              <p>{c.overviewText}</p>
              <div className="info-note">
                <ShieldCheck size={22} aria-hidden="true" />
                <p>{c.notSyllabus}</p>
              </div>
            </div>
            <div id="experience" className="course-experience">
              <p className="eyebrow">{c.planned}</p>
              <h2>{c.learningTitle}</h2>
              <div className="learning-steps">
                {c.steps.map((step, i) => (
                  <article className="learning-step" key={step.title}>
                    <span className="step-number">0{i + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <aside className="availability-card" id="availability">
            <span className="badge">
              <span className="status-dot" />
              {c.status}
            </span>
            <h2>{c.factsTitle}</h2>
            <dl>
              {[
                [c.languageLabel, c.languageValue],
                [c.accessLabel, c.accessValue],
                [c.priceLabel, c.priceValue],
                [c.launchLabel, c.launchValue],
                [c.syllabusLabel, c.syllabusValue],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="availability-warning">
              <Info size={18} aria-hidden="true" />
              {c.note}
            </p>
          </aside>
        </div>
      </section>
      <section className="section course-related">
        <div className="container related-grid">
          <article>
            <ShieldCheck size={26} aria-hidden="true" />
            <h2>{c.examTitle}</h2>
            <p>{c.examText}</p>
            <Link className="text-link" href={`/${locale}#updates`}>
              {c.examLink}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </article>
          <article>
            <Globe2 size={26} aria-hidden="true" />
            <h2>{c.otherTitle}</h2>
            <p>{c.otherText}</p>
            <Link className="text-link" href={`/${locale}#coming-soon`}>
              {c.otherLink}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
