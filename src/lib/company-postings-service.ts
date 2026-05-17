import {
  addCompanyPosting,
  closeCompanyPosting as closeLocalPosting,
  duplicateCompanyPosting as duplicateLocalPosting,
  getCompanyPostings as getLocalCompanyPostings,
  updateCompanyPosting as updateLocalPosting,
} from '@/lib/mock-postings-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { InternshipPosting } from '@/lib/types';

const TABLE = 'internship_postings';

type PostingRow = InternshipPosting & {
  representative_id?: string | null;
  monthly_stipend?: number | null;
  required_skills?: string[] | null;
  desired_skills?: string[] | null;
  importance_score?: number | null;
  required_level?: string | null;
};

const toPosting = (row: PostingRow): InternshipPosting => ({
  ...(row as InternshipPosting),
  rep_id: row.rep_id ?? row.representative_id ?? '',
  monthly_stipend_try: row.monthly_stipend_try ?? row.monthly_stipend ?? null,
});

const mapInsertPayload = (posting: InternshipPosting, overrides?: { companyId?: string; representativeId?: string }) => ({
  company_id: overrides?.companyId ?? posting.company_id,
  representative_id: overrides?.representativeId ?? posting.rep_id,
  title: posting.title,
  description: posting.description,
  location: posting.location,
  industry: posting.industry,
  start_date: posting.start_date,
  duration_weeks: posting.duration_weeks,
  is_paid: posting.is_paid,
  monthly_stipend: posting.monthly_stipend_try,
  is_remote: posting.is_remote,
  deadline: posting.deadline,
  status: posting.status,
  required_skills: (posting as PostingRow).required_skills ?? [],
  desired_skills: (posting as PostingRow).desired_skills ?? [],
  importance_score: (posting as PostingRow).importance_score ?? null,
  required_level: (posting as PostingRow).required_level ?? null,
});

export const getCompanyPostings = async (companyId: string): Promise<InternshipPosting[]> => {
  if (!isSupabaseConfigured || !supabase) return getLocalCompanyPostings(companyId);

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getCompanyPostings error:', error);
    throw error;
  }

  return (data ?? []).map((row) => toPosting(row as PostingRow));
};

export const createCompanyPosting = async (posting: InternshipPosting): Promise<InternshipPosting> => {
  if (!isSupabaseConfigured || !supabase) {
    return addCompanyPosting(posting);
  }

  const payload = mapInsertPayload(posting, {
    companyId: posting.company_id,
    representativeId: posting.rep_id,
  });

  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();

  if (error || !data) {
    console.error('Supabase createCompanyPosting error:', error);
    throw error ?? new Error('Insert failed');
  }

  return toPosting(data as PostingRow);
};

export const updateCompanyPosting = async (postingId: string, updates: Partial<InternshipPosting>): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return updateLocalPosting(postingId, updates);

  const { data, error } = await supabase.from(TABLE).update(updates).eq('posting_id', postingId).select('*').single();
  if (error || !data) {
    console.error('Supabase updateCompanyPosting error:', error);
    throw error ?? new Error('Update failed');
  }
  return toPosting(data as PostingRow);
};

export const duplicateCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return duplicateLocalPosting(postingId);

  const { data: source, error: sourceError } = await supabase.from(TABLE).select('*').eq('posting_id', postingId).single();
  if (sourceError || !source) {
    console.error('Supabase duplicateCompanyPosting source fetch error:', sourceError);
    throw sourceError ?? new Error('Source posting not found');
  }

  const sourcePosting = toPosting(source as PostingRow);
  const duplicate: InternshipPosting = {
    ...sourcePosting,
    title: `${sourcePosting.title} (Copy)`,
    status: 'draft',
    created_at: new Date().toISOString(),
  };

  return createCompanyPosting(duplicate);
};

export const closeCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return closeLocalPosting(postingId);
  return updateCompanyPosting(postingId, { status: 'closed' });
};
