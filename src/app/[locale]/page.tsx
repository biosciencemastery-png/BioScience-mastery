import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Dna,
  FileText,
  FlaskConical,
  Globe2,
  Layers3,
  Lightbulb,
  ListChecks,
  Microscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ScienceArt } from "@/components/ui/science-art";
import { examCatalogue } from "@/features/exams/catalogue";
import { ExamCards } from "@/features/exams/cards";
export const dynamic = "force-dynamic";
import { getMessages, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", hi: "/hi" },
    },
    openGraph: {
      title: "Bioscience Mastery",
      description: getMessages(locale).hero.description,
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
  const m = getMessages(locale);
  const courseUrl = `/${locale}/courses/gat-b`;
  const featureIcons = [Lightbulb, Globe2, ListChecks, ShieldCheck];
  const resourceIcons = [BookOpen, Layers3, FileText];
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              {m.hero.eyebrow}
            </p>
            <h1>
              {m.hero.title}
              <br />
              <em>{m.hero.accent}</em>
            </h1>
            <p className="hero-description">{m.hero.description}</p>
            <div className="hero-actions">
              <Link className="button button-mint" href={courseUrl}>
                {m.hero.primary}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
              <a className="text-link light-link" href="#courses">
                {m.hero.secondary}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
            <div className="hero-notes">
              <span>
                <Globe2 size={15} aria-hidden="true" />
                {m.hero.note}
              </span>
              <span>
                <Check size={15} aria-hidden="true" />
                {m.hero.note2}
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-topline">
              <span>{m.hero.visual}</span>
              <span aria-hidden="true">01 / ∞</span>
            </div>
            <ScienceArt />
            <div className="floating-note">
              <span className="note-icon">
                <Dna size={23} aria-hidden="true" />
              </span>
              <div>
                <span>{m.hero.molecule}</span>
                <strong>{m.hero.visualLabel}</strong>
              </div>
            </div>
            <span className="visual-bottom">
              <span className="status-dot" />
              {m.hero.pill}
            </span>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          <span>
            <Microscope size={20} aria-hidden="true" />
            {m.strip.one}
          </span>
          <span>
            <Globe2 size={20} aria-hidden="true" />
            {m.strip.two}
          </span>
          <span>
            <FlaskConical size={20} aria-hidden="true" />
            {m.strip.three}
          </span>
        </div>
      </div>
      <section id="courses" className="section courses-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{m.courses.eyebrow}</p>
              <h2>{m.courses.title}</h2>
            </div>
            <p>{m.courses.description}</p>
          </div>
          <div id="coming-soon">
            <ExamCards exams={await examCatalogue()} locale={locale} />
          </div>
        </div>
      </section>
      <section id="approach" className="section approach-section">
        <div className="container approach-grid">
          <div className="approach-intro">
            <p className="eyebrow">{m.approach.eyebrow}</p>
            <h2>
              {m.approach.title}
              <br />
              <span>{m.approach.accent}</span>
            </h2>
            <p>{m.approach.description}</p>
            <div className="approach-motif" aria-hidden="true">
              <div>
                <Dna size={44} strokeWidth={1} />
              </div>
              <span />
              <div>
                <Lightbulb size={35} strokeWidth={1.2} />
              </div>
              <span />
              <div>
                <Sparkles size={33} strokeWidth={1.2} />
              </div>
            </div>
          </div>
          <div className="features-grid">
            {m.approach.items.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <article className="feature" key={feature.title}>
                  <span className="feature-icon">
                    <Icon size={23} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section id="updates" className="section updates-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{m.updates.eyebrow}</p>
              <h2>{m.updates.title}</h2>
            </div>
            <p>{m.updates.description}</p>
          </div>
          <div className="update-panel">
            <div className="update-icon">
              <FileText size={28} strokeWidth={1.4} aria-hidden="true" />
            </div>
            <div className="update-copy">
              <span className="tiny-label">{m.updates.status}</span>
              <h3>{m.updates.name}</h3>
              <p>{m.updates.text}</p>
            </div>
            <div className="update-date">
              <span>{m.updates.dateLabel}</span>
              <strong>{m.updates.date}</strong>
            </div>
          </div>
          <p className="section-note">
            <ShieldCheck size={16} aria-hidden="true" />
            {m.updates.foot}
          </p>
        </div>
      </section>
      <section id="resources" className="section resources-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{m.resources.eyebrow}</p>
              <h2>{m.resources.title}</h2>
            </div>
            <p>{m.resources.description}</p>
          </div>
          <div className="resource-grid">
            {m.resources.items.map((resource, index) => {
              const Icon = resourceIcons[index];
              return (
                <article className="resource-card" key={resource.title}>
                  <div className={`resource-art resource-art-${index}`}>
                    <Icon size={56} strokeWidth={1} aria-hidden="true" />
                    <span className="resource-number" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="resource-copy">
                    <span className="tiny-label">{m.resources.status}</span>
                    <h3>{resource.title}</h3>
                    <p>{resource.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="section-note">{m.resources.note}</p>
        </div>
      </section>
      <section id="faq" className="section faq-section">
        <div className="container faq-grid">
          <div>
            <p className="eyebrow">{m.faq.eyebrow}</p>
            <h2>{m.faq.title}</h2>
            <p className="muted">{m.faq.description}</p>
          </div>
          <div className="faq-list">
            {m.faq.items.map((item) => (
              <details key={item.question}>
                <summary>
                  {item.question}
                  <ChevronDown size={19} aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="closing-section">
        <div className="container closing-panel">
          <div>
            <p className="eyebrow">{m.closing.eyebrow}</p>
            <h2>{m.closing.title}</h2>
            <p>{m.closing.text}</p>
          </div>
          <Link className="button button-mint" href={courseUrl}>
            {m.closing.cta}
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
