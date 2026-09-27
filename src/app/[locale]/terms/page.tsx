import { LegalPage } from "@/features/legal/page";
export const dynamic = "force-dynamic";
export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <LegalPage params={params} kind="terms" />;
}
