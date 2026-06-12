import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Admin pages require a Supabase project.");
  }
  return supabase;
};

export type AdminDashboardStats = {
  total_students: number;
  total_companies: number;
  total_company_representatives: number;
  total_active_postings: number;
  total_postings: number;
  total_applications: number;
  accepted_applications: number;
  interview_applications: number;
  total_messages: number;
  total_cv_analyses: number;
  average_match_score: number | null;
  pending_company_verifications: number | null;
  applications_by_status: Record<string, number>;
  newest_users: AdminUser[];
  newest_companies: AdminCompany[];
  newest_postings: AdminPosting[];
};

export type AdminUser = {
  person_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "student" | "company_rep" | "admin" | string;
  created_at: string;
  kvkk_consent: boolean | null;
  terms_consent: boolean | null;
  student_id: string | null;
  university: string | null;
  department: string | null;
  company_id: string | null;
  company_name: string | null;
  representative_id: string | null;
  representative_job_title: string | null;
};

export type AdminCompany = {
  company_id: string;
  name: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  is_verified: boolean;
  verified_at: string | null;
  representative_name: string | null;
  representative_email: string | null;
  active_posting_count: number;
  application_count: number;
  created_at: string | null;
};

export type AdminPosting = {
  internship_posting_id: string;
  title: string | null;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  status: "draft" | "pending_review" | "active" | "closed" | string;
  deadline: string | null;
  application_count: number;
  created_at: string | null;
};

export const assertCurrentUserIsAdmin = async (): Promise<boolean> => {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("is_current_user_admin");
  if (error) throw new Error(error.message || "Could not verify admin access.");
  return data === true;
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_admin_dashboard_stats");
  if (error) throw new Error(error.message || "Could not load admin dashboard stats.");
  return data as AdminDashboardStats;
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_admin_users");
  if (error) throw new Error(error.message || "Could not load admin users.");
  return (data ?? []) as AdminUser[];
};

export const getAdminCompanies = async (): Promise<AdminCompany[]> => {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_admin_companies");
  if (error) throw new Error(error.message || "Could not load admin companies.");
  return (data ?? []) as AdminCompany[];
};

export const getAdminPostings = async (): Promise<AdminPosting[]> => {
  const client = ensureSupabase();
  const { data, error } = await client.rpc("get_admin_postings");
  if (error) throw new Error(error.message || "Could not load admin postings.");
  return (data ?? []) as AdminPosting[];
};

export const updateCompanyVerification = async (companyId: string, verified: boolean): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.rpc("admin_update_company_verification", {
    p_company_id: companyId,
    p_verified: verified,
  });
  if (error) throw new Error(error.message || "Could not update company verification.");
};

export const updatePostingStatus = async (postingId: string, status: "active" | "closed"): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.rpc("admin_update_posting_status", {
    p_posting_id: postingId,
    p_status: status,
  });
  if (error) throw new Error(error.message || "Could not update posting status.");
};
