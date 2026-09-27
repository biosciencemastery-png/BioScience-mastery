import { AuthPage } from "@/features/auth/auth-page";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  return (
    <AuthPage
      params={params}
      kind="login"
      notice={(await searchParams).notice}
    />
  );
}
