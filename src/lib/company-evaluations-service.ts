import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getCurrentCompanyContext } from "@/lib/company-profile-service";

export type CompanyEvaluationCandidate = {
  application_id: string;
  status: string;
  created_at: string;
  posting_title: string;
  student_name: string;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

export const getCompanyEvaluationCandidates = async (): Promise<CompanyEvaluationCandidate[]> => {
  const client = ensureSupabase();
  const context = await getCurrentCompanyContext();

  const { data, error } = await client
    .from("applications")
    .select(`
      application_id,
      status,
      created_at,
      students(student_id, persons(first_name, last_name)),
      internship_postings(title)
    `)
    .eq("company_id", context.company.company_id)
    .in("status", ["accepted", "interview"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load evaluation candidates.");

  return ((data ?? []) as any[]).map((item) => {
    const student = Array.isArray(item.students) ? item.students[0] : item.students;
    const person = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;
    const posting = Array.isArray(item.internship_postings) ? item.internship_postings[0] : item.internship_postings;

    return {
      application_id: item.application_id,
      status: item.status,
      created_at: item.created_at,
      posting_title: posting?.title ?? "Not provided",
      student_name: [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Not provided",
    };
  });
};
