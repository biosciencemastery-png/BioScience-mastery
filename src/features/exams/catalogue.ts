import "server-only";
import { publicDatabase } from "@/lib/supabase/public";
export type ExamRecord = {
  id: string;
  slug: string;
  name: string;
  name_hi: string | null;
  courses: {
    id: string;
    slug: string;
    launch_status: "coming_soon" | "in_preparation" | "published" | "archived";
  }[];
};
export async function examCatalogue(): Promise<ExamRecord[] | null> {
  const db = publicDatabase();
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("examinations")
      .select("id,slug,name,name_hi,courses(id,slug,launch_status)")
      .order("display_order");
    return error ? null : (data as ExamRecord[]);
  } catch {
    return null;
  }
}
