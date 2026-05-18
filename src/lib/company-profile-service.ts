import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthUser = { id: string; email?: string | null };
type Person = { person_id: string; first_name: string | null; last_name: string | null; email: string | null; auth_user_id: string };
type Representative = { representative_id: string; person_id: string; company_id: string; job_title: string | null };
type Company = {
  company_id: string;
  name: string | null;
  industry: string | null;
  location: string | null;
  size: string | null;
  website: string | null;
  description: string | null;
};

export type CompanyContext = { user: AuthUser; person: Person; representative: Representative; company: Company };

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
};

export const getCurrentCompanyContext = async (): Promise<CompanyContext> => {
  const client = ensureSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("You must be logged in.");

  const { data: person, error: personError } = await client
    .from("persons")
    .select("person_id, first_name, last_name, email, auth_user_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (personError || !person) throw new Error("Could not find person record for this user.");

  const { data: representative, error: representativeError } = await client
    .from("company_representatives")
    .select("representative_id, person_id, company_id, job_title")
    .eq("person_id", person.person_id)
    .maybeSingle();
  if (representativeError || !representative) throw new Error("Could not find company representative record.");

  const { data: company, error: companyError } = await client
    .from("companies")
    .select("company_id, name, industry, location, size, website, description")
    .eq("company_id", representative.company_id)
    .maybeSingle();
  if (companyError || !company) throw new Error("Could not find company record.");

  return { user: { id: authData.user.id, email: authData.user.email }, person, representative, company };
};

export const updateCompanyProfile = async (input: {
  company: { name: string; industry: string; location: string; size: string; website: string; description: string };
  representativeJobTitle: string;
}) => {
  const client = ensureSupabase();
  const context = await getCurrentCompanyContext();

  const { error: companyError } = await client
    .from("companies")
    .update({
      name: input.company.name || null,
      industry: input.company.industry || null,
      location: input.company.location || null,
      size: input.company.size || null,
      website: input.company.website || null,
      description: input.company.description || null,
    })
    .eq("company_id", context.company.company_id);

  if (companyError) throw new Error(companyError.message || "Could not update company profile.");

  const { error: representativeError } = await client
    .from("company_representatives")
    .update({ job_title: input.representativeJobTitle || null })
    .eq("representative_id", context.representative.representative_id);

  if (representativeError) throw new Error(representativeError.message || "Could not update representative profile.");
};
