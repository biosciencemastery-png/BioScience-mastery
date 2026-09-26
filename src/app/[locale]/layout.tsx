import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getMessages, isLocale, locales } from "@/lib/i18n";
import { canIndex, siteUrl } from "@/lib/site";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    metadataBase: siteUrl(),
    title: {
      default: "Bioscience Mastery | Biotechnology & Life Sciences",
      template: "%s | Bioscience Mastery",
    },
    description: getMessages(locale).hero.description,
    robots: { index: canIndex(), follow: canIndex() },
    icons: { icon: "/icon.svg" },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return (
    <html lang={locale}>
      <body>
        <a href="#main" className="skip-link">
          {messages.skip}
        </a>
        <Header locale={locale} messages={messages} />
        {children}
        <Footer locale={locale} messages={messages} />
      </body>
    </html>
  );
}
