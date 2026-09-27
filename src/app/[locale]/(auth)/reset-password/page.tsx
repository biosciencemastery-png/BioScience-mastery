import { notFound } from "next/navigation";
import { AuthPage } from "@/features/auth/auth-page";
import { requireUser } from "@/lib/auth/guards";
import { isLocale } from "@/lib/i18n";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireUser(locale);
  return <AuthPage params={params} kind="reset" />;
}
