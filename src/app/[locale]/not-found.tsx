"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMessages } from "@/lib/i18n";
export default function NotFound() {
  const params = useParams();
  const locale = params?.locale === "hi" ? "hi" : "en";
  const m = getMessages(locale).notFound;
  return (
    <main className="error-page" id="main">
      <span className="eyebrow">404</span>
      <h1>{m.title}</h1>
      <p>{m.text}</p>
      <Link href={`/${locale}`} className="button">
        {m.back}
      </Link>
    </main>
  );
}
