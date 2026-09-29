import { StudentProfileForm } from "@/features/auth/student-profile-form";
import { examCatalogue } from "@/features/exams/catalogue";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { isLocale } from "@/lib/i18n";
import { authMessages } from "@/lib/auth/messages";
import { AuthForm } from "@/features/auth/auth-form";
import { logoutAction } from "@/features/auth/actions";
import { StudentShell } from "@/features/student/shell";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string; view?: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const { supabase, user } = await requireUser(locale);
  const m = authMessages(locale);

  const { data: deletionRequest } = await supabase
    .from("account_deletion_requests")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["requested", "processing"])
    .maybeSingle();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name,preferred_language")
    .eq("id", user.id)
    .single();

  const [academic, goals, preferences, exams] = await Promise.all([
    supabase
      .from("student_academic_profiles")
      .select("details")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("student_exam_goals")
      .select("examination_id,target_year,is_active,archived_at")
      .eq("user_id", user.id)
      .is("archived_at", null),

    supabase
      .from("notification_preferences")
      .select("marketing_consent")
      .eq("user_id", user.id)
      .single(),

    examCatalogue(),
  ]);

  const query = await searchParams;

  const activeGoals = goals.data ?? [];

  const activeGoal =
    activeGoals.find((goal) => goal.is_active) ?? activeGoals[0];

  const studentExams = activeGoals.flatMap((goal) => {
    const exam = exams?.find(
      (item) => item.id === goal.examination_id,
    );

    if (!exam) return [];

    return [
      {
        id: exam.id,
        name:
          locale === "hi"
            ? exam.name_hi || exam.name
            : exam.name,
        targetYear: goal.target_year,
        active:
          goal.examination_id === activeGoal?.examination_id,
      },
    ];
  });

  const targets = studentExams.map((exam) =>
    exam.targetYear
      ? `${exam.name} ${exam.targetYear}`
      : exam.name,
  );

  return (
    <StudentShell
      locale={locale}
      settings={
        query.view === "settings" || !!query.notice
      }
      name={profile?.display_name}
      targets={targets}
      exams={studentExams}
    >
      <main id="main" className="auth-section">
        <div className="auth-card account-card">
          <p className="eyebrow">
            BIOSCIENCE MASTERY
          </p>

          <h1>{m.account}</h1>

          {query.notice === "failed" && (
            <p
              role="alert"
              className="auth-message error"
            >
              {m.errors.failed}
            </p>
          )}

          <p>{m.accountIntro}</p>

          <p className="auth-help">
            {user.email}
          </p>

          {error || !profile ? (
            <p role="alert">
              {m.profileUnavailable}
            </p>
          ) : (
            <AuthForm
              kind="profile"
              locale={locale}
              profile={{
                display_name:
                  profile.display_name,
                preferred_language:
                  profile.preferred_language,
              }}
            />
          )}

          {academic.error ||
          goals.error ||
          preferences.error ? (
            <p role="status">
              {m.profileUnavailable}
            </p>
          ) : (
            <StudentProfileForm
              locale={locale}
              exams={exams}
              details={
                academic.data?.details ?? {}
              }
              selected={activeGoals.map(
                (goal) => goal.examination_id,
              )}
              year={String(
                activeGoal?.target_year ?? "",
              )}
              marketing={
                preferences.data
                  ?.marketing_consent ?? false
              }
            />
          )}

          <form action={logoutAction}>
            <input
              type="hidden"
              name="locale"
              value={locale}
            />

            <button className="button">
              {m.signOut}
            </button>
          </form>

          <section className="deletion-section">
            <h2>{m.requestDeletion}</h2>

            <p>{m.deletionHelp}</p>

            {deletionRequest ? (
              <p
                role="status"
                className="auth-message"
              >
                {m.success.deletionRequested}
              </p>
            ) : (
              <AuthForm
                kind="deletion"
                locale={locale}
              />
            )}
          </section>
        </div>
      </main>
    </StudentShell>
  );
}