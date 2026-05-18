import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getCurrentCompanyContext } from "@/lib/company-profile-service";

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

export type CompanyUsage = {
  activePostingsUsed: number;
  totalPostings: number;
  applicantsViewed: number;
};

export const getCompanyUsage = async (): Promise<CompanyUsage> => {
  const client = ensureSupabase();
  const context = await getCurrentCompanyContext();

  const [{ data: postings, error: postingsError }, { data: applications, error: applicationsError }] = await Promise.all([
    client.from("internship_postings").select("internship_posting_id, status").eq("company_id", context.company.company_id),
    client.from("applications").select("application_id").eq("company_id", context.company.company_id),
  ]);

  if (postingsError) throw new Error(postingsError.message || "Could not load posting usage.");
  if (applicationsError) throw new Error(applicationsError.message || "Could not load application usage.");

  const postingRows = postings ?? [];
  return {
    activePostingsUsed: postingRows.filter((posting) => posting.status === "active").length,
    totalPostings: postingRows.length,
    applicantsViewed: (applications ?? []).length,
  };
};
