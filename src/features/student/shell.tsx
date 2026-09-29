"use client";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  ListChecks,
  Files,
  CalendarDays,
  Timer,
  Info,
  Library,
  ChartNoAxesCombined,
  Download,
  Bell,
  UserRound,
  CircleHelp,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { themeSnapshot, subscribeTheme, toggleTheme } from "@/lib/theme";
import {
  logoutAction,
  setActiveExamAction,
} from "@/features/auth/actions";
import "./shell.css";

const copy = {
  en: {
    dashboard: "Dashboard",
    groups: ["LEARN", "PRACTICE", "EXAMS", "PROGRESS", "RESOURCES"],
    items: [
      "Study Materials",
      "Practice Questions",
      "Previous Year Questions",
      "Scheduled Quizzes",
      "Mock Tests",
      "Exam Information",
      "All Exams",
      "Analytics",
      "Downloads",
    ],
    notifications: "Notifications",
    settings: "Profile / Settings",
    help: "Help",
    logout: "Logout",
    soon: "Coming soon",
    welcome: "Welcome back",
    intro: "Your preparation, one step at a time.",
    cards: [
      "Syllabus Progress",
      "Questions Practiced",
      "Mock Tests",
      "Accuracy",
    ],
    noData: "No activity data available",
    continue: "Continue Learning",
    start: "Your next chapter starts here.",
    empty:
      "Published learning modules will appear here when available. Set your examination goals in your profile to get ready.",
    quick: "Quick Actions",
    performance: "Your progress",
    performanceText:
      "Your learning activity will shape this view. No performance data is available yet.",
    upcoming: "Exam information",
    upcomingText:
      "No upcoming events are shown here. Explore the examination catalogue for current course information.",
    explore: "Explore exams",
    choose: "Set your examination goals",
    menu: "Open student menu",
    close: "Close menu",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
    theme: "Change colour theme",
    label: "Student workspace",
  },
  hi: {
    dashboard: "अवलोकन",
    groups: ["अध्ययन", "अभ्यास", "परीक्षाएँ", "प्रगति", "संसाधन"],
    items: [
      "अध्ययन सामग्री",
      "अभ्यास प्रश्न",
      "पिछले वर्षों के प्रश्न",
      "निर्धारित प्रश्नोत्तरी",
      "अभ्यास परीक्षाएँ",
      "परीक्षा जानकारी",
      "सभी परीक्षाएँ",
      "प्रगति विश्लेषण",
      "डाउनलोड",
    ],
    notifications: "सूचनाएँ",
    settings: "प्रोफ़ाइल / सेटिंग",
    help: "सहायता",
    logout: "लॉग आउट",
    soon: "जल्द उपलब्ध होगा",
    welcome: "फिर से स्वागत है",
    intro: "कदम-दर-कदम अपनी तैयारी आगे बढ़ाएँ।",
    cards: [
      "पाठ्यक्रम की प्रगति",
      "हल किए गए प्रश्न",
      "अभ्यास परीक्षाएँ",
      "सटीकता",
    ],
    noData: "गतिविधि के आँकड़े उपलब्ध नहीं हैं",
    continue: "अध्ययन जारी रखें",
    start: "आपकी नई शुरुआत यहीं से होती है।",
    empty:
      "प्रकाशित अध्ययन सुविधाएँ उपलब्ध होने पर यहाँ दिखेंगी। तैयारी के लिए अपनी प्रोफ़ाइल में परीक्षा लक्ष्य तय करें।",
    quick: "त्वरित विकल्प",
    performance: "आपकी प्रगति",
    performanceText:
      "आपकी अध्ययन गतिविधि के आधार पर यहाँ जानकारी दिखेगी। अभी प्रदर्शन के आँकड़े उपलब्ध नहीं हैं।",
    upcoming: "परीक्षा जानकारी",
    upcomingText:
      "यहाँ अभी कोई आगामी कार्यक्रम नहीं दिखाया गया है। वर्तमान पाठ्यक्रम जानकारी के लिए परीक्षा सूची देखें।",
    explore: "परीक्षाएँ देखें",
    choose: "अपनी परीक्षा के लक्ष्य तय करें",
    menu: "विद्यार्थी मेन्यू खोलें",
    close: "मेन्यू बंद करें",
    collapse: "साइडबार छोटा करें",
    expand: "साइडबार बड़ा करें",
    theme: "रंग शैली बदलें",
    label: "विद्यार्थी अध्ययन क्षेत्र",
  },
};
const icons = [
  BookOpen,
  ListChecks,
  Files,
  CalendarDays,
  Timer,
  Info,
  Library,
  ChartNoAxesCombined,
  Download,
];
export function StudentShell({
  locale,
  settings,
  name,
  targets,
  exams,
  children,
}: {
  locale: Locale;
  settings: boolean;
  name?: string;
  targets: string[];
  exams: {
    id: string;
    name: string;
    targetYear: number | null;
    active: boolean;
  }[];
  children: ReactNode;
}) {
  const m = copy[locale],
    base = `/${locale}/account`,
    [collapsed, setCollapsed] = useState(false),
    dialog = useRef<HTMLDialogElement>(null);
  const theme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    () => "light",
  );
  const close = () => dialog.current?.close();
  const nav = (
    <>
      <Link
        className="student-brand"
        href={`/${locale}`}
        aria-label="BioScience Mastery"
      >
        <span aria-hidden="true">
          B<span>m</span>
        </span>
        <strong className="student-nav-label">
          BioScience
          <br />
          Mastery
        </strong>
      </Link>
      <nav aria-label={m.label}>
        <Link
          href={base}
          aria-label={m.dashboard}
          aria-current={!settings ? "page" : undefined}
          onClick={close}
        >
          <LayoutDashboard size={19} />
          <span className="student-nav-label">{m.dashboard}</span>
        </Link>
        {[[0], [1, 2, 3, 4], [5, 6], [7], [8]].map((indexes, group) => (
          <div className="student-nav-group" key={group}>
            <p className="student-nav-label">{m.groups[group]}</p>
            {indexes.map((i) => {
              const Icon = icons[i];
              return i === 5 || i === 6 ? (
                <Link
                  key={i}
                  href={`/${locale}/exams`}
                  aria-label={m.items[i]}
                  onClick={close}
                >
                  <Icon size={18} />
                  <span className="student-nav-label">{m.items[i]}</span>
                </Link>
              ) : (
                <button
                  key={i}
                  type="button"
                  disabled
                  aria-label={`${m.items[i]} — ${m.soon}`}
                  title={m.soon}
                >
                  <Icon size={18} />
                  <span className="student-nav-label">{m.items[i]}</span>
                  <small className="student-nav-label">{m.soon}</small>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="student-nav-bottom">
        <button
          type="button"
          disabled
          aria-label={`${m.notifications} — ${m.soon}`}
          title={m.soon}
        >
          <Bell size={18} />
          <span className="student-nav-label">{m.notifications}</span>
          <small className="student-nav-label">{m.soon}</small>
        </button>
        <Link
          href={`${base}?view=settings`}
          aria-label={m.settings}
          aria-current={settings ? "page" : undefined}
          onClick={close}
        >
          <UserRound size={18} />
          <span className="student-nav-label">{m.settings}</span>
        </Link>
        <a href="mailto:biosciencemastery@gmail.com" aria-label={m.help}>
          <CircleHelp size={18} />
          <span className="student-nav-label">{m.help}</span>
        </a>
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button aria-label={m.logout}>
            <LogOut size={18} />
            <span className="student-nav-label">{m.logout}</span>
          </button>
        </form>
      </div>
    </>
  );
  return (
    <div className="student-shell" data-collapsed={collapsed}>
      <aside className="student-sidebar">
        {nav}
        <button
          className="student-collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? m.expand : m.collapse}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>
      </aside>
      <dialog
        ref={dialog}
        className="student-drawer"
        aria-label={m.menu}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button
          className="student-drawer-close"
          onClick={close}
          aria-label={m.close}
        >
          <X size={22} />
        </button>
        {nav}
      </dialog>
      <div className="student-body">
        <header className="student-topbar">
          <div>
  <button
    className="student-menu-button"
    onClick={() => dialog.current?.showModal()}
    aria-label={m.menu}
  >
    <Menu size={22} />
  </button>

  {exams.length > 0 ? (
    <form action={setActiveExamAction}>
      <input type="hidden" name="locale" value={locale} />

      <select
        name="examination_id"
        defaultValue={
          exams.find((exam) => exam.active)?.id ??
          exams[0]?.id
        }
        aria-label={
          locale === "hi"
            ? "सक्रिय परीक्षा चुनें"
            : "Select active examination"
        }
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {exams.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {exam.name}
            {exam.targetYear ? ` ${exam.targetYear}` : ""}
          </option>
        ))}
      </select>
    </form>
  ) : (
    <strong>{settings ? m.settings : m.dashboard}</strong>
  )}
</div>
          <div>
            <Link
              href={`/${locale === "en" ? "hi" : "en"}/account${settings ? "?view=settings" : ""}`}
              lang={locale === "en" ? "hi" : "en"}
            >
              {locale === "en" ? "हिंदी" : "English"}
            </Link>
            <button onClick={toggleTheme} aria-label={m.theme}>
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <Link
              className="student-avatar"
              href={`${base}?view=settings`}
              aria-label={m.settings}
            >
              <UserRound size={20} />
            </Link>
          </div>
        </header>
        {settings ? (
          children
        ) : (
          <main id="main" tabIndex={-1} className="student-main">
            <section className="student-welcome">
              <p>BioScience Mastery</p>
              <h1>
                {m.welcome}
                {name ? `, ${name}` : ""}
              </h1>
              <p>{m.intro}</p>
              {targets.length > 0 ? (
                <p className="student-target">{targets.join(" · ")}</p>
              ) : (
                <Link href={`${base}?view=settings`}>
                  {m.choose} <ArrowRight size={15} />
                </Link>
              )}
            </section>
            <div className="student-stats">
              {m.cards.map((title, i) => {
                const Icon = [BookOpen, ListChecks, Timer, ChartNoAxesCombined][
                  i
                ];
                return (
                  <section className="student-card" key={title}>
                    <Icon size={20} aria-hidden />
                    <h2>{title}</h2>
                    <strong aria-hidden="true">—</strong>
                    <p>{m.noData}</p>
                  </section>
                );
              })}
            </div>
            <div className="student-overview-grid">
              <section className="student-card student-continue">
                <h2>{m.continue}</h2>
                <BookOpen size={38} aria-hidden />
                <h3>{m.start}</h3>
                <p>{m.empty}</p>
                <Link href={`${base}?view=settings`}>
                  {m.settings}
                  <ArrowRight size={16} />
                </Link>
              </section>
              <section className="student-card">
                <h2>{m.quick}</h2>
                <div className="student-quick">
                  {[0, 1, 2, 4].map((i) => {
                    const Icon = icons[i];
                    return (
                      <button type="button" key={i} disabled>
                        <Icon size={20} aria-hidden />
                        <span>
                          {m.items[i]}
                          <small>{m.soon}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
            <div className="student-overview-grid">
              <section className="student-card student-empty">
                <h2>{m.performance}</h2>
                <ChartNoAxesCombined size={36} aria-hidden />
                <p>{m.performanceText}</p>
              </section>
              <section className="student-card student-empty">
                <h2>{m.upcoming}</h2>
                <CalendarDays size={36} aria-hidden />
                <p>{m.upcomingText}</p>
                <Link href={`/${locale}/exams`}>
                  {m.explore}
                  <ArrowRight size={16} />
                </Link>
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
