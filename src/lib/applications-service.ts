import { supabase } from "@/lib/supabase";
import type { InternshipPosting } from "@/lib/types";

type ApplicationRecord = {
  application_id: string;
  student_id: string;
  internship_posting_id: string;
  company_id: string;
  status: "submitted" | "reviewed" | "shortlisted" | "rejected" | "accepted";
  cover_letter: string | null;
  match_score: number | null;
  created_at: string;
  updated_at: string;
};

const ensureSupabase = () => {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

export const getCurrentStudentId = async (): Promise<string> => {
  const client = ensureSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("You must be logged in.");

  const { data: person, error: personError } = await client
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (personError || !person) throw new Error("Could not find person record for this user.");

  const { data: student, error: studentError } = await client
    .from("students")
    .select("student_id")
    .eq("person_id", person.person_id)
    .single();

  if (studentError || !student) throw new Error("Could not find student profile for this user.");

  return student.student_id;
};

export const getPostingById = async (postingId: string): Promise<InternshipPosting> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("internship_postings")
    .select(`
      internship_posting_id,
      company_id,
      representative_id,
      title,
      description,
      location,
      industry,
      required_skills,
      desired_skills,
      start_date,
      duration_weeks,
      is_paid,
      monthly_stipend,
      is_remote,
      status,
      created_at,
      deadline,
      companies(name)
    `)
    .eq("internship_posting_id", postingId)
    .single();

  if (error || !data) {
    if (error) console.error("Failed to load posting by id", { postingId, error });
    throw new Error("Posting not found.");
  }

  const companyRelation = Array.isArray(data.companies) ? data.companies[0] : data.companies;

  return {
    posting_id: data.internship_posting_id,
    company_id: data.company_id,
    rep_id: data.representative_id ?? null,
    title: data.title,
    description: data.description,
    location: data.location,
    industry: data.industry,
    required_skills: Array.isArray(data.required_skills) ? data.required_skills : [],
    desired_skills: Array.isArray(data.desired_skills) ? data.desired_skills : [],
    start_date: data.start_date,
    duration_weeks: data.duration_weeks,
    is_paid: data.is_paid,
    monthly_stipend_try: data.monthly_stipend ?? null,
    is_remote: data.is_remote,
    status: data.status,
    created_at: data.created_at,
    deadline: data.deadline,
    company_name: companyRelation?.name ?? null,
  };
};

export const applyToPosting = async (postingId: string, coverLetter?: string, matchScore?: number) => {
  const client = ensureSupabase();
  const studentId = await getCurrentStudentId();
  const posting = await getPostingById(postingId);

  const { error } = await client.from("applications").insert({
    student_id: studentId,
    internship_posting_id: postingId,
    company_id: posting.company_id,
    cover_letter: coverLetter?.trim() ? coverLetter.trim() : null,
    match_score: typeof matchScore === "number" ? matchScore : null,
    status: "submitted",
  });

  if (error) {
    if (error.code === "23505") throw new Error("You have already applied to this posting.");
    throw new Error(error.message || "Could not submit application.");
  }
};

export const getExistingApplication = async (postingId: string): Promise<ApplicationRecord | null> => {
  const client = ensureSupabase();
  const studentId = await getCurrentStudentId();

  const { data, error } = await client
    .from("applications")
    .select("application_id, student_id, internship_posting_id, company_id, status, cover_letter, match_score, created_at, updated_at")
    .eq("student_id", studentId)
    .eq("internship_posting_id", postingId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Could not check existing application.");
  return data;
};
