import {
  addCompanyPosting,
  closeCompanyPosting as closeLocalPosting,
  duplicateCompanyPosting as duplicateLocalPosting,
  getCompanyPostings as getLocalCompanyPostings,
  updateCompanyPosting as updateLocalPosting,
} from "@/lib/mock-postings-storage";
import { COMPANIES } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { InternshipPosting } from "@/lib/types";

const TABLE = "internship_postings";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreateCompanyPostingResult = {
  posting: InternshipPosting;
  source: "supabase" | "localStorage";
  error?: string;
};

const toPosting = (row: InternshipPosting): InternshipPosting => ({ ...row });

const isUuid = (value: string | null | undefined): value is string =>
  Boolean(value && UUID_REGEX.test(value));

const resolveCompanyIdentity = async (posting: InternshipPosting) => {
  const mockCompany = COMPANIES.find((company) => company.company_id === posting.company_id);
  const mockName = mockCompany?.name?.trim();

  if (isUuid(posting.company_id)) {
    return {
      companyId: posting.company_id,
      companyName: mockName,
    };
  }

  const query = supabase
    .from("companies")
    .select("company_id,name")
    .limit(1);

  const { data, error } = mockName
    ? await query.ilike("name", mockName)
    : await query.eq("company_id", posting.company_id);

  if (error || !data?.length) {
    throw error ?? new Error(`Company mapping not found for ${posting.company_id}${mockName ? ` (${mockName})` : ""}`);
  }

  return {
    companyId: data[0].company_id,
    companyName: data[0].name ?? mockName,
  };
};

const resolveRepresentativeId = async (companyId: string, incomingRepId: string) => {
  if (isUuid(incomingRepId)) {
    return incomingRepId;
  }

  const { data, error } = await supabase
    .from("company_representatives")
    .select("rep_id")
    .eq("company_id", companyId)
    .limit(1);

  if (error || !data?.length) {
    throw error ?? new Error(`Representative mapping not found for company ${companyId}`);
  }

  return data[0].rep_id;
};

export const getCompanyPostings = async (companyId: string): Promise<InternshipPosting[]> => {
  if (!supabase) {
    return getLocalCompanyPostings(companyId);
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => toPosting(row as InternshipPosting));
  } catch {
    return getLocalCompanyPostings(companyId);
  }
};

export const createCompanyPosting = async (posting: InternshipPosting): Promise<CreateCompanyPostingResult> => {
  if (!supabase) {
    return {
      posting: addCompanyPosting(posting),
      source: "localStorage",
    };
  }

  try {
    const { companyId } = await resolveCompanyIdentity(posting);
    const repId = await resolveRepresentativeId(companyId, posting.rep_id);

    const insertPayload: InternshipPosting = {
      ...posting,
      company_id: companyId,
      rep_id: repId,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(insertPayload)
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return {
      posting: toPosting(data as InternshipPosting),
      source: "supabase",
    };
  } catch (error) {
    console.error("Supabase insert failed for internship_postings", {
      posting,
      error,
    });

    const fallbackPosting = addCompanyPosting(posting);

    return {
      posting: fallbackPosting,
      source: "localStorage",
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };
  }
};

export const updateCompanyPosting = async (
  postingId: string,
  updates: Partial<InternshipPosting>,
): Promise<InternshipPosting | null> => {
  if (!supabase) {
    return updateLocalPosting(postingId, updates);
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq("posting_id", postingId)
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return toPosting(data as InternshipPosting);
  } catch {
    return updateLocalPosting(postingId, updates);
  }
};

export const duplicateCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  const localSource = duplicateLocalPosting;

  if (!supabase) {
    return localSource(postingId);
  }

  try {
    const { data: source, error: sourceError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("posting_id", postingId)
      .single();

    if (sourceError || !source) {
      throw sourceError;
    }

    const duplicate: InternshipPosting = {
      ...(source as InternshipPosting),
      posting_id: `post_local_${Date.now()}`,
      title: `${source.title} (Copy)`,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    const result = await createCompanyPosting(duplicate);
    return result.posting;
  } catch {
    return localSource(postingId);
  }
};

export const closeCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!supabase) {
    return closeLocalPosting(postingId);
  }

  try {
    return await updateCompanyPosting(postingId, { status: "closed" });
  } catch {
    return closeLocalPosting(postingId);
  }
};
