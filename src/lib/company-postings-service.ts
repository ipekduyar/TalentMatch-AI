import {
  addCompanyPosting,
  closeCompanyPosting as closeLocalPosting,
  duplicateCompanyPosting as duplicateLocalPosting,
  getCompanyPostings as getLocalCompanyPostings,
  updateCompanyPosting as updateLocalPosting,
} from "@/lib/mock-postings-storage";
import { supabase } from "@/lib/supabase";
import { InternshipPosting } from "@/lib/types";

const TABLE = "internship_postings";

const toPosting = (row: InternshipPosting): InternshipPosting => ({ ...row });

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

export const createCompanyPosting = async (posting: InternshipPosting): Promise<InternshipPosting> => {
  if (!supabase) {
    return addCompanyPosting(posting);
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(posting)
      .select("*")
      .single();

    if (error || !data) {
      throw error;
    }

    return toPosting(data as InternshipPosting);
  } catch {
    return addCompanyPosting(posting);
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

    return await createCompanyPosting(duplicate);
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
