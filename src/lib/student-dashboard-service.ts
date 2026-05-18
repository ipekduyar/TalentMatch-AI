import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { InternshipPosting } from "@/lib/types";

export type LatestCvAnalysis = {
  extracted_skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  improvement_suggestions: string[];
  overall_score: number | null;
  created_at: string;
};

export type DashboardActivityItem = {
  text: string;
  time: string;
  status: string;
};

export type DashboardDeadlineItem = {
  posting_id: string;
  title: string;
  company_name: string;
  ends_in_days: number;
};

export type DashboardLearningProgressPoint = {
  label: string;
  score: number;
};

export type DashboardApplication = {
  application_id: string;
  status: string;
  created_at: string;
  posting_id: string;
  posting_title: string;
  company_name: string;
};

export type StudentDashboardActivityData = {
  applications: DashboardApplication[];
  recentActivities: DashboardActivityItem[];
  upcomingDeadlines: DashboardDeadlineItem[];
  learningProgress: DashboardLearningProgressPoint[];
};

const toDateLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
};

export const getLatestCompletedCvAnalysis = async (): Promise<LatestCvAnalysis | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  const { data: person } = await supabase.from("persons").select("person_id").eq("auth_user_id", authData.user.id).maybeSingle();
  if (!person?.person_id) return null;
  const { data: student } = await supabase.from("students").select("student_id").eq("person_id", person.person_id).maybeSingle();
  if (!student?.student_id) return null;

  const { data: analysis, error: analysisError } = await supabase
    .from("cv_analysis_reports")
    .select("extracted_skills, strengths, weaknesses, suggested_roles, improvement_suggestions, overall_score, created_at")
    .eq("student_id", student.student_id)
    .eq("analysis_status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError || !analysis) return null;

  return {
    extracted_skills: Array.isArray(analysis.extracted_skills) ? analysis.extracted_skills : [],
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
    suggested_roles: Array.isArray(analysis.suggested_roles) ? analysis.suggested_roles : [],
    improvement_suggestions: Array.isArray(analysis.improvement_suggestions) ? analysis.improvement_suggestions : [],
    overall_score: typeof analysis.overall_score === "number" ? analysis.overall_score : null,
    created_at: typeof analysis.created_at === "string" ? analysis.created_at : "",
  };
};

export const getActiveInternshipPostings = async (): Promise<InternshipPosting[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("internship_postings")
    .select("internship_posting_id, company_id, representative_id, title, description, location, industry, required_skills, desired_skills, start_date, duration_weeks, is_paid, monthly_stipend, is_remote, status, created_at, deadline, companies(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((posting) => ({
    posting_id: posting.internship_posting_id,
    company_id: posting.company_id,
    rep_id: posting.representative_id ?? null,
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

export const getStudentDashboardActivityData = async (): Promise<StudentDashboardActivityData> => {
  const empty: StudentDashboardActivityData = { applications: [], recentActivities: [{ text: "Upload and analyze your CV to start receiving insights.", time: "Now", status: "Next Step" }], upcomingDeadlines: [], learningProgress: [{ label: "CV", score: 0 }, { label: "Skills", score: 0 }, { label: "Applications", score: 0 }, { label: "Learning", score: 0 }] };
  if (!isSupabaseConfigured || !supabase) return empty;

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return empty;
  const { data: person } = await supabase.from("persons").select("person_id").eq("auth_user_id", authData.user.id).maybeSingle();
  if (!person?.person_id) return empty;
  const { data: student } = await supabase.from("students").select("student_id").eq("person_id", person.person_id).maybeSingle();
  if (!student?.student_id) return empty;

  const [analysis, appsRes, deadlinesRes] = await Promise.all([
    getLatestCompletedCvAnalysis(),
    supabase
      .from("applications")
      .select("application_id,status,created_at,internship_posting_id,internship_postings(title,companies(name))")
      .eq("student_id", student.student_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("internship_postings")
      .select("internship_posting_id,title,deadline,status,companies(name)")
      .eq("status", "active")
      .not("deadline", "is", null)
      .order("deadline", { ascending: true })
      .limit(6),
  ]);

  const applications = (appsRes.data ?? []).map((row: any) => {
    const posting = Array.isArray(row.internship_postings) ? row.internship_postings[0] : row.internship_postings;
    const company = Array.isArray(posting?.companies) ? posting.companies[0] : posting?.companies;
    return {
      application_id: row.application_id,
      status: row.status,
      created_at: row.created_at,
      posting_id: row.internship_posting_id,
      posting_title: posting?.title ?? "Untitled Posting",
      company_name: company?.name ?? "Unknown Company",
    };
  });

  const activities: DashboardActivityItem[] = applications.slice(0, 3).map((app) => ({
    text: `Applied to ${app.posting_title} at ${app.company_name}`,
    time: toDateLabel(app.created_at),
    status: "Applied",
  }));

  if (analysis) {
    activities.push({
      text: `CV analysis completed: ${analysis.extracted_skills.length} skills extracted`,
      time: toDateLabel(analysis.created_at),
      status: "AI Insight",
    });
  }

  const now = Date.now();
  const upcomingDeadlines = (deadlinesRes.data ?? [])
    .map((row: any) => {
      const d = new Date(row.deadline);
      const endsIn = Number.isNaN(d.getTime()) ? 0 : Math.max(0, Math.ceil((d.getTime() - now) / (1000 * 60 * 60 * 24)));
      return {
        posting_id: row.internship_posting_id,
        title: row.title,
        company_name: row.companies?.name ?? "Unknown Company",
        ends_in_days: endsIn,
      };
    })
    .filter((item) => item.ends_in_days >= 0)
    .slice(0, 3);

  const overall = Math.round(analysis?.overall_score ?? 0);
  const skillGapCount = analysis?.weaknesses?.length ?? 0;
  const appCount = applications.length;
  const learningProgress = [
    { label: "CV", score: Math.max(0, overall) },
    { label: "Skills", score: Math.max(0, Math.min(100, overall - skillGapCount * 6)) },
    { label: "Applications", score: Math.min(100, 25 + appCount * 15) },
    { label: "Learning", score: Math.max(0, Math.min(100, overall - skillGapCount * 5 + appCount * 3)) },
  ];

  return {
    applications,
    recentActivities: activities.length ? activities : empty.recentActivities,
    upcomingDeadlines,
    learningProgress,
  };
};
