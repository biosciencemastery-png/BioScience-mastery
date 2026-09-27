import { policyKinds, policyTitles } from "@/features/legal/content";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import type { Locale, Messages } from "@/lib/i18n";

export function Footer({
  locale,
  messages: m,
}: {
  locale: Locale;
  messages: Messages;
}) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href={`/${locale}`} aria-label="Bioscience Mastery">
              <Brand />
            </Link>
            <p>{m.footer.description}</p>
            <p className="small muted">{m.footer.sub}</p>
          </div>
          <div>
            <p className="footer-heading">{m.footer.explore}</p>
            <Link href={`/${locale}/courses/gat-b`}>
              GAT-B <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link href={`/${locale}#coming-soon`}>{m.courses.coming}</Link>
            <Link href={`/${locale}#resources`}>{m.nav.resources}</Link>
          </div>
          <div>
            <p className="footer-heading">{m.footer.information}</p>
            {policyKinds.map((kind) => (
              <Link key={kind} href={`/${locale}/${kind}`}>
                {policyTitles[locale][kind]}
              </Link>
            ))}
            <Link href={`/${locale}#approach`}>{m.footer.about}</Link>
            <Link href={`/${locale}#faq`}>{m.footer.faq}</Link>
            <Link href={`/${locale}/courses/gat-b#availability`}>
              {m.footer.status}
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {m.footer.copyright}
          </span>
          <span>{m.footer.phase}</span>
        </div>
        <p className="footer-disclaimer">{m.footer.independent}</p>
      </div>
    </footer>
  );
}
