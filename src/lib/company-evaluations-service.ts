import { getCurrentCompanyContext } from "@/lib/company-profile-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type CompanyStudentEvaluation = {
  evaluation_id: string;
  application_id: string;
  technical_skills: number;
  communication: number;
  teamwork: number;
  responsibility: number;
  overall_score: number;
  strengths: string | null;
  improvement_feedback: string | null;
  would_recommend: boolean | null;
  created_at: string;
  updated_at: string;
};

export type StudentCompanyEvaluation = {
  evaluation_id: string;
  application_id: string;
  mentorship_quality: number;
  learning_opportunity: number;
  work_environment: number;
  task_relevance: number;
  overall_score: number;
  positive_feedback: string | null;
  improvement_feedback: string | null;
  would_recommend: boolean | null;
  created_at: string;
  updated_at: string;
};

export type CompanyEvaluationCandidate = {
  application_id: string;
  status: "accepted";
  created_at: string;
  posting_title: string;
  student_name: string;
  company_evaluation: CompanyStudentEvaluation | null;
  student_evaluation: StudentCompanyEvaluation | null;
};

export type CompanyStudentEvaluationInput = {
  application_id: string;
  technical_skills: number;
  communication: number;
  teamwork: number;
  responsibility: number;
  overall_score: number;
  strengths: string;
  improvement_feedback: string;
  would_recommend: boolean | null;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

const asSingleRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const normalizeCompanyEvaluation = (value: any): CompanyStudentEvaluation | null => {
  const evaluation = asSingleRelation(value);
  return evaluation ? (evaluation as CompanyStudentEvaluation) : null;
};

const normalizeStudentEvaluation = (value: any): StudentCompanyEvaluation | null => {
  const evaluation = asSingleRelation(value);
  return evaluation ? (evaluation as StudentCompanyEvaluation) : null;
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
      internship_postings(title),
      company_student_evaluations(
        evaluation_id,
        application_id,
        technical_skills,
        communication,
        teamwork,
        responsibility,
        overall_score,
        strengths,
        improvement_feedback,
        would_recommend,
        created_at,
        updated_at
      ),
      student_company_evaluations(
        evaluation_id,
        application_id,
        mentorship_quality,
        learning_opportunity,
        work_environment,
        task_relevance,
        overall_score,
        positive_feedback,
        improvement_feedback,
        would_recommend,
        created_at,
        updated_at
      )
    `)
    .eq("company_id", context.company.company_id)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load accepted internships for evaluation.");

  return ((data ?? []) as any[]).map((item) => {
    const student = asSingleRelation(item.students);
    const person = asSingleRelation(student?.persons);
    const posting = asSingleRelation(item.internship_postings);

    return {
      application_id: item.application_id,
      status: "accepted",
      created_at: item.created_at,
      posting_title: posting?.title ?? "Not provided",
      student_name: [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Not provided",
      company_evaluation: normalizeCompanyEvaluation(item.company_student_evaluations),
      student_evaluation: normalizeStudentEvaluation(item.student_company_evaluations),
    };
  });
};

export const submitCompanyStudentEvaluation = async (input: CompanyStudentEvaluationInput): Promise<string> => {
  const client = ensureSupabase();

  const { data, error } = await client.rpc("submit_company_student_evaluation", {
    p_application_id: input.application_id,
    p_technical_skills: input.technical_skills,
    p_communication: input.communication,
    p_teamwork: input.teamwork,
    p_responsibility: input.responsibility,
    p_overall_score: input.overall_score,
    p_strengths: input.strengths,
    p_improvement_feedback: input.improvement_feedback,
    p_would_recommend: input.would_recommend,
  });

  if (error) throw new Error(error.message || "Could not submit evaluation.");
  if (!data) throw new Error("Evaluation submission did not return an id.");

  return data as string;
};
