import { POSTINGS, REPS } from "@/lib/mock-data";
import { InternshipPosting } from "@/lib/types";

const STORAGE_KEY = "talentmatch_company_postings";

const getLocalPostings = (): InternshipPosting[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InternshipPosting[]) : [];
  } catch {
    return [];
  }
};

const saveLocalPostings = (postings: InternshipPosting[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(postings));
};

const findRepForCompany = (companyId: string): string => {
  const foundRep = REPS.find((rep) => rep.company_id === companyId);
  return foundRep?.rep_id ?? "rep_unknown";
};

export const getCompanyPostings = (companyId: string): InternshipPosting[] => {
  const basePostings = POSTINGS.filter((posting) => posting.company_id === companyId);
  const localPostings = getLocalPostings().filter((posting) => posting.company_id === companyId);
  return [...localPostings, ...basePostings];
};

export const addCompanyPosting = (posting: InternshipPosting): InternshipPosting => {
  const localPostings = getLocalPostings();
  const nextPostings = [posting, ...localPostings.filter((localPosting) => localPosting.posting_id !== posting.posting_id)];
  saveLocalPostings(nextPostings);
  return posting;
};

export const updateCompanyPosting = (
  postingId: string,
  updates: Partial<InternshipPosting>,
): InternshipPosting | null => {
  const localPostings = getLocalPostings();
  const existing = localPostings.find((posting) => posting.posting_id === postingId)
    ?? POSTINGS.find((posting) => posting.posting_id === postingId);

  if (!existing) {
    return null;
  }

  const updatedPosting: InternshipPosting = { ...existing, ...updates };
  const filtered = localPostings.filter((posting) => posting.posting_id !== postingId);
  saveLocalPostings([updatedPosting, ...filtered]);
  return updatedPosting;
};

export const duplicateCompanyPosting = (postingId: string): InternshipPosting | null => {
  const source = getLocalPostings().find((posting) => posting.posting_id === postingId)
    ?? POSTINGS.find((posting) => posting.posting_id === postingId);

  if (!source) {
    return null;
  }

  const duplicate: InternshipPosting = {
    ...source,
    posting_id: `post_local_${Date.now()}`,
    title: `${source.title} (Copy)`,
    status: "draft",
    created_at: new Date().toISOString(),
    rep_id: source.rep_id || findRepForCompany(source.company_id),
  };

  addCompanyPosting(duplicate);
  return duplicate;
};

export const closeCompanyPosting = (postingId: string): InternshipPosting | null => {
  return updateCompanyPosting(postingId, { status: "closed" });
};
