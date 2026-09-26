"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMessages } from "@/lib/i18n";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = params?.locale === "hi" ? "hi" : "en";
  const m = getMessages(locale).error;
  return (
    <main id="main" className="error-page">
      <h1>{m.title}</h1>
      <p>{m.text}</p>
      <button className="button" onClick={reset}>
        {m.retry}
      </button>
      <Link className="text-link" href={`/${locale}`}>
        {m.back}
      </Link>
    </main>
  );
}
