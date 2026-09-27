import { AuthPage } from "@/features/auth/auth-page";
export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AuthPage params={params} kind="forgot" />;
}
