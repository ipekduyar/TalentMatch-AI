import { getCurrentStudentId } from "@/lib/applications-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CompanyStudentEvaluation } from "@/lib/company-evaluations-service";

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

export type StudentEvaluationInternship = {
  application_id: string;
  status: "accepted";
  created_at: string;
  posting_title: string;
  company_name: string;
  student_evaluation: StudentCompanyEvaluation | null;
  company_evaluation: CompanyStudentEvaluation | null;
};

export type StudentCompanyEvaluationInput = {
  application_id: string;
  mentorship_quality: number;
  learning_opportunity: number;
  work_environment: number;
  task_relevance: number;
  overall_score: number;
  positive_feedback: string;
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

export const getStudentEvaluationInternships = async (): Promise<StudentEvaluationInternship[]> => {
  const client = ensureSupabase();
  const studentId = await getCurrentStudentId();

  const { data, error } = await client
    .from("applications")
    .select(`
      application_id,
      status,
      created_at,
      internship_postings(title, companies(name)),
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
      ),
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
      )
    `)
    .eq("student_id", studentId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load accepted internships for evaluation.");

  return ((data ?? []) as any[]).map((item) => {
    const posting = asSingleRelation(item.internship_postings);
    const company = asSingleRelation(posting?.companies);

    return {
      application_id: item.application_id,
      status: "accepted",
      created_at: item.created_at,
      posting_title: posting?.title ?? "Not provided",
      company_name: company?.name ?? "Not provided",
      student_evaluation: asSingleRelation(item.student_company_evaluations) as StudentCompanyEvaluation | null,
      company_evaluation: asSingleRelation(item.company_student_evaluations) as CompanyStudentEvaluation | null,
    };
  });
};

export const submitStudentCompanyEvaluation = async (input: StudentCompanyEvaluationInput): Promise<string> => {
  const client = ensureSupabase();

  const { data, error } = await client.rpc("submit_student_company_evaluation", {
    p_application_id: input.application_id,
    p_mentorship_quality: input.mentorship_quality,
    p_learning_opportunity: input.learning_opportunity,
    p_work_environment: input.work_environment,
    p_task_relevance: input.task_relevance,
    p_overall_score: input.overall_score,
    p_positive_feedback: input.positive_feedback,
    p_improvement_feedback: input.improvement_feedback,
    p_would_recommend: input.would_recommend,
  });

  if (error) throw new Error(error.message || "Could not submit evaluation.");
  if (!data) throw new Error("Evaluation submission did not return an id.");

  return data as string;
};
