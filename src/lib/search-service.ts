import { POSTINGS } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { InternshipPosting } from "@/lib/types";

export type SearchCvAnalysis = {
  extracted_skills: string[];
  suggested_roles: string[];
  created_at: string;
};

export type SearchPosting = InternshipPosting & {
  required_skills: string[];
  desired_skills: string[];
};

export const getLatestSearchCvAnalysis = async (): Promise<SearchCvAnalysis | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    if (authError) console.error("Failed to resolve current user for search CV analysis", authError);
    return null;
  }

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (personError || !person?.person_id) {
    if (personError) console.error("Failed to resolve person for search CV analysis", personError);
    return null;
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_id")
    .eq("person_id", person.person_id)
    .maybeSingle();

  if (studentError || !student?.student_id) {
    if (studentError) console.error("Failed to resolve student for search CV analysis", studentError);
    return null;
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("cv_analysis_reports")
    .select("extracted_skills, suggested_roles, created_at")
    .eq("student_id", student.student_id)
    .eq("analysis_status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    console.error("Failed to load latest completed CV analysis for search", analysisError);
    return null;
  }

  if (!analysis) return null;

  return {
    extracted_skills: Array.isArray(analysis.extracted_skills) ? analysis.extracted_skills : [],
    suggested_roles: Array.isArray(analysis.suggested_roles) ? analysis.suggested_roles : [],
    created_at: typeof analysis.created_at === "string" ? analysis.created_at : "",
  };
};

export const getSearchActivePostings = async (): Promise<SearchPosting[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return POSTINGS.map((posting) => ({ ...posting, required_skills: [], desired_skills: [] }));
  }

  const { data, error } = await supabase
    .from("internship_postings")
    .select("internship_posting_id, company_id, representative_id, title, description, location, industry, required_skills, desired_skills, start_date, duration_weeks, is_paid, monthly_stipend, is_remote, status, created_at, deadline, companies(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load active internship postings for search", error);
    return POSTINGS.map((posting) => ({ ...posting, required_skills: [], desired_skills: [] }));
  }

  if (!data || data.length === 0) return [];

  return data.map((posting) => ({
    posting_id: posting.internship_posting_id,
    company_id: posting.company_id,
    rep_id: posting.representative_id,
    title: posting.title,
    description: posting.description,
    location: posting.location,
    industry: posting.industry,
    required_skills: Array.isArray(posting.required_skills) ? posting.required_skills : [],
    desired_skills: Array.isArray(posting.desired_skills) ? posting.desired_skills : [],
    start_date: posting.start_date,
    duration_weeks: posting.duration_weeks,
    is_paid: posting.is_paid,
    monthly_stipend_try: posting.monthly_stipend ?? null,
    is_remote: posting.is_remote,
    status: posting.status,
    created_at: posting.created_at,
    deadline: posting.deadline,
    company_name: posting.companies?.name ?? "Unknown Company",
  }));
};
