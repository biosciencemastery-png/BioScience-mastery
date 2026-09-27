import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { readPolicy } from "./server";
import { policyKinds, policyTitles, type PolicyKind } from "./content";
export async function LegalPage({
  params,
  kind,
}: {
  params: Promise<{ locale: string }>;
  kind: PolicyKind;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const p = await readPolicy(locale, kind),
    hi = locale === "hi";
  const email = process.env.SUPPORT_EMAIL || "biosciencemastery@gmail.com";
  return (
    <main id="main" className="section">
      <article className="container legal-page">
        <h1>{p.title}</h1>
        <p className="auth-message" role="status">
          {p.status === "draft"
            ? hi
              ? "मसौदा — समीक्षा आवश्यक (DRAFT / REVIEW REQUIRED)। अभी प्रभावी नहीं।"
              : "DRAFT — REVIEW REQUIRED. Not yet effective."
            : hi
              ? "प्रकाशित नीति"
              : "Published policy"}
        </p>
        <p>
          {hi ? "संस्करण" : "Version"}: {p.version} ·{" "}
          {hi ? "प्रभावी तिथि" : "Effective date"}:{" "}
          {p.effective_at
            ? new Date(p.effective_at).toISOString().slice(0, 10)
            : hi
              ? "समीक्षा लंबित"
              : "Pending review"}
        </p>
        {p.body.split("\n\n").map((block: string, i: number) => {
          const [heading, ...body] = block.split("\n");
          return (
            <section key={i}>
              <h2>{heading}</h2>
              <p>{body.join("\n")}</p>
            </section>
          );
        })}
        <p>
          {hi ? "सहायता" : "Support"}: <a href={`mailto:${email}`}>{email}</a>
        </p>
        <nav aria-label={hi ? "नीतियाँ" : "Policies"}>
          {policyKinds
            .filter((k) => k !== kind)
            .map((k) => (
              <Link key={k} href={`/${locale}/${k}`}>
                {policyTitles[locale][k]}
              </Link>
            ))}
        </nav>
      </article>
    </main>
  );
}
