"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import type { Locale, Messages } from "@/lib/i18n";

export function Header({
  locale,
  messages: m,
  authEnabled = false,
}: {
  locale: Locale;
  messages: Messages;
  authEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const home = `/${locale}`;
  const links = [
    ["courses", m.nav.courses],
    ["updates", m.nav.exams],
    ["resources", m.nav.resources],
    ["approach", m.nav.about],
  ];
  const accountLabel = locale === "hi" ? "मेरा खाता" : "My account";

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function languagePath(next: Locale) {
    return pathname.replace(/^\/(en|hi)(?=\/|$)/, `/${next}`);
  }
  function switchLanguage(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    setOpen(false);
    // Preserve same-origin one-time email links when changing interface language.
    if (
      (pathname.includes("/auth/confirm") ||
        pathname.includes("/notifications/")) &&
      window.location.search
    ) {
      event.preventDefault();
      window.location.assign(languagePath(next) + window.location.search);
    }
  }
  return (
    <header className="site-header" ref={header}>
      <div className="container header-inner">
        <Link
          className="brand-link"
          href={home}
          aria-label="Bioscience Mastery"
          onClick={() => setOpen(false)}
        >
          <Brand />
        </Link>
        <nav className="desktop-nav" aria-label={m.nav.label}>
          {links.map(([id, label]) => (
            <Link
              key={id}
              href={
                id === "courses" || id === "updates"
                  ? `${home}/exams`
                  : `${home}#${id}`
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {authEnabled && (
            <Link
              className="account-nav"
              href={`${home}/account`}
              onClick={() => setOpen(false)}
            >
              {accountLabel}
            </Link>
          )}
          <div
            className="language-switch"
            role="group"
            aria-label={m.nav.language}
          >
            <Link
              href={languagePath("en")}
              lang="en"
              aria-label="English"
              aria-current={locale === "en" ? "true" : undefined}
              onClick={(event) => switchLanguage(event, "en")}
            >
              EN
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={languagePath("hi")}
              lang="hi"
              aria-label="हिंदी"
              aria-current={locale === "hi" ? "true" : undefined}
              onClick={(event) => switchLanguage(event, "hi")}
            >
              हिं
            </Link>
          </div>
          <Link
            className="button button-small header-cta"
            href={`${home}/courses/gat-b`}
          >
            {m.nav.cta}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            className="menu-toggle"
            ref={menuButton}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? m.nav.close : m.nav.menu}
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label={m.nav.label}
        hidden={!open}
      >
        {links.map(([id, label]) => (
          <Link
            key={id}
            href={
              id === "courses" || id === "updates"
                ? `${home}/exams`
                : `${home}#${id}`
            }
            onClick={() => setOpen(false)}
          >
            {label}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        ))}
        {authEnabled && (
          <Link href={`${home}/account`} onClick={() => setOpen(false)}>
            {accountLabel}
          </Link>
        )}
        <Link href={`${home}/courses/gat-b`} onClick={() => setOpen(false)}>
          {m.nav.cta}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}
